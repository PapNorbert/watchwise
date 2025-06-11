import getPool from './connection_db.js';


export async function getRating(userID, show) {
  try {
    const aqlQuery = `FOR edge IN has_rated
    FILTER edge._from == @from
    FILTER edge._to == @to
    LIMIT 1
    RETURN edge.rating`;
    const pool = await getPool();
    const cursor = await pool.query(aqlQuery, { from: `users/${userID}`, to: show });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

/** 
  Handle a user trying to rate a movie/serie
  
  Create or update a rating edge and recalculate show rating statistics

  @param {string} showType - movie / series
  @param {string} showKey - A unique identifier for the show.
  @param {string} jwtUsername - The username of the user changing rating
  @param {float} newRating - The new rating to be assigned to the show.

  @returns {Promise<{ 
    error: boolean; 
    errorMessage?: string; 
    actionPerformed?: string; 
    key?: string;
  }
*/
export async function handleShowRatedTransaction(showType, showKey, jwtUsername, newRating) {
  const writeCollections = ["has_rated"]
  // set up connelctions to write in
  switch (showType) {
    case 'movie':
      writeCollections.push("movies")
      break;
    case 'serie':
      writeCollections.push("series")
      break;
  }

  const pool = await getPool();
  const transaction = await pool.beginTransaction({
    write: writeCollections,
    read: [],
    allowImplicit: false
  });
  try {
    const show = await transaction.step(async () => {
      const aqlQuery = `FOR doc IN ${showType}s
        FILTER doc._key == @key
        RETURN doc`;
      const pool = await getPool();
      const cursor = await pool.query(aqlQuery, { key: showKey });
      return (await cursor.all())[0];
    });
    const pool = await getPool();
    const usersCollection = pool.collection("users");

    const user = await transaction.step(async () => {
      return await usersCollection.firstExample({ username: jwtUsername });
    })

    if (!show && !user) {
      // show or user not found
      const transactionResult = await transaction.abort();
      console.log('Transaction for rating show: ', transactionResult.status, '. No show or user');
      return {
        error: true,
        errorMessage: '404'
      }
    }

    const ratingDate = new Date(Date.now());
    const ratingEdge = await transaction.step(async () => {
      // check user already joined
      const aqlQuery = `FOR edge IN has_rated
          FILTER edge._from == @from
          FILTER edge._to == @to
          LIMIT 1
          RETURN edge`;
      const pool = await getPool();
      const cursor = await pool.query(aqlQuery, { from: user._id, to: show._id });
      return (await cursor.all())[0];
    });

    if (ratingEdge) { // user already has a rating, update it
      // update rating edge
      await transaction.step(async () => {
        const aqlQuery = `FOR edge IN has_rated
              FILTER edge._from == @from AND edge._to == @to
              UPDATE edge WITH { rating: @newRating, date: @ratingDate } IN has_rated
            RETURN NEW`;
        const pool = await getPool();
        const cursor = await pool.query(aqlQuery, {
          from: user._id, to: show._id, newRating: newRating, ratingDate: ratingDate
        });
        return (await cursor.all())[0];
      });
      // update show data
      const new_total_rating = show.total_ratings;
      const new_sum_ratings = show.sum_of_ratings - ratingEdge.rating + newRating;
      const new_average = parseFloat((new_sum_ratings / new_total_rating).toFixed(2));
      await transaction.step(async () => {
        const aqlQuery = `FOR doc IN ${showType}s
            FILTER doc._key == @key
            UPDATE doc WITH {
              average_rating: @new_average,
              total_ratings: @new_total_rating,
              sum_of_ratings: @new_sum_ratings
            } IN ${showType}s`;
        const pool = await getPool();
        await pool.query(aqlQuery, {
          key: show._key, new_average: new_average,
          new_total_rating: new_total_rating, new_sum_ratings: new_sum_ratings
        });
        return true;
      });

      const transactionResult = await transaction.commit();
      console.log('Transaction for rating show: ', transactionResult.status,
        '. Rating updated');
      return {
        error: false,
        actionPerformed: 'rating_updated'
      };
    } else { // new rating
      // save rating edge
      const ratingEdgeKey = await transaction.step(async () => {
        const aqlQuery =
          `INSERT { 
              _from: @from, _to: @to, rating: @rating, date: @ratingDate
            } INTO has_rated
          RETURN NEW._key`;
        const pool = await getPool();
        const cursor = await pool.query(aqlQuery, {
          from: user._id, to: show._id, rating: newRating, ratingDate: ratingDate
        });
        return (await cursor.all())[0];
      });
      // update show data
      const new_total_rating = show.total_ratings + 1;
      const new_sum_ratings = show.sum_of_ratings + newRating;
      const new_average = parseFloat((new_sum_ratings / new_total_rating).toFixed(2));
      await transaction.step(async () => {
        const aqlQuery = `FOR doc IN ${showType}s
            FILTER doc._key == @key
            UPDATE doc WITH {
              average_rating: @new_average,
              total_ratings: @new_total_rating,
              sum_of_ratings: @new_sum_ratings
            } IN ${showType}s`;
        const pool = await getPool();
        await pool.query(aqlQuery, {
          key: show._key, new_average: new_average,
          new_total_rating: new_total_rating, new_sum_ratings: new_sum_ratings
        });
        return true;
      });

      const transactionResult = await transaction.commit();
      console.log('Transaction for rating show: ', transactionResult.status,
        '. New rating added');
      return {
        error: false,
        actionPerformed: 'rating_saved',
        key: ratingEdgeKey
      };
    }

  } catch (err) {
    console.log(err.message);
    const transactionResult = await transaction.abort();
    console.log('Transaction for rating show: ', transactionResult.status, '. Error processing request');
    return {
      error: true,
      errorMessage: '500'
    }
  }
}