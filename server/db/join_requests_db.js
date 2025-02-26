import getPool from './connection_db.js';


export async function findJoinRequestByCreator(creator, page, limit) {
  try {
    const aqlQuery = `FOR group IN watch_groups
    FILTER group.creator == @creator
      FOR doc IN join_request
      FILTER doc._to == group._id
    LIMIT @offset, @count
    RETURN MERGE(doc, { full: group.currentNrOfPersons >= group.personLimit } )`;
    const pool = await getPool();
    const cursor = await pool.query(aqlQuery, { creator: creator, offset: (page - 1) * limit, count: limit });
    return await cursor.all();
  } catch (err) {
    throw err.message;
  }
}

export async function getJoinRequestCountByCreator(creator) {
  try {
    const aqlQuery = `RETURN LENGTH(
    FOR group IN watch_groups
    FILTER group.creator == @creator
      FOR doc IN join_request
      FILTER doc._from == group._id
        RETURN true)`;
    const pool = await getPool();
    const cursor = await pool.query(aqlQuery, { creator: creator });
    return (await cursor.all())[0];
  } catch (err) {
    throw err.message;
  }
}

export async function deleteJoinRequestEdge(from, to) {
  try {
    const aqlQuery = `FOR edge IN join_request
    FILTER edge._from == @from
    FILTER edge._to == @to
    REMOVE { _key: edge._key } IN join_request`;
    const pool = await getPool();
    const cursor = await pool.query(aqlQuery, { from: from, to: to });
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Warning for join request edge during delete request: `, err.message);
      return false;
    } else {
      console.log(err);
      throw err.message;
    }

  }
}

export async function deleteJoinRequestEdgeByKey(key) {
  try {
    const aqlQuery = `REMOVE { _key: @key } IN join_request`;
    const pool = await getPool();
    const cursor = await pool.query(aqlQuery, { key: key });
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Warning for join request edge during delete request: `, err.message);
      return false;
    } else {
      console.log(err);
      throw err.message;
    }

  }
}

export async function deleteJoinRequestEdgeByTo(to) {
  try {
    const aqlQuery = `FOR edge IN join_request
    FILTER edge._to == @to
    REMOVE { _key: edge._key } IN join_request`;
    const pool = await getPool();
    const cursor = await pool.query(aqlQuery, { to: to });
    return true;
  } catch (err) {
    if (err.message == "AQL: document not found (while executing)") {
      console.log(`Warning for joinRequestEdge document with _key ${key} during delete request: `, err.message);
      return false;
    } else {
      throw err.message;
    }

  }
}

export async function handleJoinReqAcceptTransaction(joinReqKey) {
  try {
    const transaction = await pool.beginTransaction({
      write: ["join_request", "joined_group", "watch_groups"],
      read: ["users"],
      allowImplicit: false
    });

    const joinRequest = await transaction.step(async () => {
      const aqlQuery = `FOR doc IN join_request
        FILTER doc._key == @key
        RETURN doc`;
    const pool = await getPool();
    const cursor = await pool.query(aqlQuery, { key: joinReqKey });
      return (await cursor.all())[0];
    });
    if (!joinRequest) {
      const transactionResult = await transaction.abort();
      console.log('Transaction for joining group: ', transactionResult.status, '. No join request');
      return {
        error: true,
        errorMessage: '404'
      }
    }
    const usersCollection = pool.collection("users");
    const watchGroupCollection = pool.collection("watch_groups");

    const user = await transaction.step(async () => {
      return await usersCollection.firstExample({ _id: joinRequest._from });
    });

    const watchGroup = await transaction.step(async () => {
      return await watchGroupCollection.firstExample({ _id: joinRequest._to });
    });

    if (watchGroup !== null && user !== null) { // check watchGroup and user exist
      const joinEdgeExists = await transaction.step(async () => {
        // check user already joined
        const aqlQuery = `RETURN LENGTH(FOR doc IN joined_group
          FILTER doc._from == @from
          FILTER doc._to == @to
          LIMIT 1 RETURN true) > 0`;
        const cursor = await pool.query(aqlQuery, { from: user._id, to: watchGroup._id });
        return (await cursor.all())[0];
      });

      let groupBecameFull = false;
      if (!joinEdgeExists) {
        if (watchGroup.currentNrOfPersons >= watchGroup.personLimit) {
          const transactionResult = await transaction.abort();
          console.log('Transaction for joining group: ', transactionResult.status, '. Error creating join edge');
          return {
            error: true,
            errorMessage: 'group_full'
          }
        }

        // create join edge
        const joinedEdgeKey = await transaction.step(async () => {
          // check user already joined
          const aqlQuery = `INSERT { _from: @from, _to: @to } INTO joined_group
          RETURN NEW._key`;
          const cursor = await pool.query(aqlQuery, { from: user._id, to: watchGroup._id });
          return (await cursor.all())[0];
        });
        if (!joinedEdgeKey) {
          const transactionResult = await transaction.abort();
          console.log('Transaction for joining group: ', transactionResult.status, '. Error creating join edge');
          return {
            error: true,
            errorMessage: 'error_join_accept'
          }
        } else {
          // joined, update number of persons in group
          if (watchGroup.currentNrOfPersons + 1 === watchGroup.personLimit) {
            groupBecameFull = true;
          }
          const updatedGroupPersonCount = await transaction.step(async () => {
            await watchGroupCollection.update(watchGroup._key, { currentNrOfPersons: watchGroup.currentNrOfPersons + 1 });
            return true;
          });
          if (!updatedGroupPersonCount) {
            const transactionResult = await transaction.abort();
            console.log('Transaction for joining group: ', transactionResult.status, '. Error updating watch group person nr');
            return {
              error: true,
              errorMessage: 'error_join_accept'
            }
          }

        }

      }

      // delete the request edge, it was processed
      const deleted = await transaction.step(async () => {
        // check user already joined
        const aqlQuery = `REMOVE { _key: @key } IN join_request`;
        await pool.query(aqlQuery, { key: joinReqKey });
        return true;
      });

      if (deleted) {
        const transactionResult = await transaction.commit();
        console.log('Transaction for joining group: ', transactionResult.status,
          '. Request accepted');
        return {
          error: false,
          groupBecameFull: groupBecameFull
        }

      } else {
        const transactionResult = await transaction.abort();
        console.log('Transaction for joining group: ', transactionResult.status, '. Error during join delete');
        return {
          error: true,
          errorMessage: 'error_join_accept'
        }
      }
    } else {
      // watchgroup or user not found
      const transactionResult = await transaction.abort();
      console.log('Transaction for joining group: ', transactionResult.status, '. No group or user');
      return {
        error: true,
        errorMessage: '404'
      }
    }

  } catch (err) {
    console.log(err.message);
    throw err.message;
  }
}