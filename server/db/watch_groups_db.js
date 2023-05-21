import pool from './connection_db.js'
import { sortTypesWG } from '../config/sortTypes.js'

const watchGroupCollection = pool.collection("watch_groups");

function addFilters(aqlQuery, aqlParameters, userLocLat, userLocLong, titleSearch, showSearch,
  creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch, docName = 'doc') {
  if (titleSearch) {
    aqlQuery += `
    FILTER CONTAINS(UPPER(${docName}.title), @titleFilter)
    `;
    aqlParameters.titleFilter = titleSearch.toUpperCase();
  }
  if (showSearch) {
    aqlQuery += `
    FILTER CONTAINS(UPPER(${docName}.show), @showFilter)
    `;
    aqlParameters.showFilter = showSearch.toUpperCase();
  }
  if (creatorSearch) {
    aqlQuery += `
    FILTER CONTAINS(UPPER(${docName}.creator), @creatorFilter)
    `;
    aqlParameters.creatorFilter = creatorSearch.toUpperCase();
  }
  if (watchDateSearch) {
    aqlQuery += `
    FILTER CONTAINS(UPPER(${docName}.watch_date), @watchDateSearch)
    `;
    aqlParameters.watchDateSearch = watchDateSearch.toUpperCase();
  }
  if (onlyNotFullSearch == 'true') {
    aqlQuery += `
    FILTER ${docName}.currentNrOfPersons < ${docName}.personLimit
    `;
  }
  if (userLocLat && userLocLong && maxDistanceSearch) {
    aqlQuery += `
    FILTER DISTANCE(${docName}.location[0], ${docName}.location[1], @userLocLat, @userLocLong) <= @maxDistanceSearch
    `;
    aqlParameters.userLocLat = userLocLat;
    aqlParameters.userLocLong = userLocLong;
    // DISTANCE function returns distance in m
    aqlParameters.maxDistanceSearch = (maxDistanceSearch * 1000);
  }
  return aqlQuery;
}

function addSort(aqlQuery, aqlParameters, userLocLat, userLocLong, sortBy, docName = 'doc') {
  switch (sortBy) {
    case sortTypesWG.oldest:
      aqlQuery += `
      SORT ${docName}.creation_date 
      `;
      break;
    case sortTypesWG.show:
      aqlQuery += `
      SORT ${docName}.show
      `;
      break;
    case sortTypesWG.title:
      aqlQuery += `
      SORT ${docName}.title
      `;
      break;
    case sortTypesWG.creator:
      aqlQuery += `
      SORT ${docName}.creator
      `;
      break;
    case sortTypesWG.watch_date:
      aqlQuery += `
      SORT ${docName}.watch_date DESC
      `;
      break;
    case sortTypesWG.distance:
      if (userLocLat && userLocLong) {
        aqlQuery += `
        SORT DISTANCE(${docName}.location[0], ${docName}.location[1], @userLocLat, @userLocLong)
        `;
        aqlParameters.userLocLat = userLocLat;
        aqlParameters.userLocLong = userLocLong;
      }
      break;
    default:
      // newest
      aqlQuery += `
      SORT ${docName}.creation_date DESC
      `;
      break;
  }
  return aqlQuery;

}



export async function findWatchGroups(page, limit, userLocLat, userLocLong,
  titleSearch, showSearch, creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch, sortBy) {
  try {
    let aqlParameters = { offset: (page - 1) * limit, count: limit };
    let aqlQuery = `FOR doc IN watch_groups
    `;

    aqlQuery = addFilters(aqlQuery, aqlParameters, userLocLat, userLocLong,
      titleSearch, showSearch, creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch);
    aqlQuery = addSort(aqlQuery, aqlParameters, userLocLat, userLocLong, sortBy);

    aqlQuery += `
    LIMIT @offset, @count
    RETURN UNSET(doc, "comments")`;
    const cursor = await pool.query(aqlQuery, aqlParameters);
    return await cursor.all();
  } catch (err) {
    console.log(err.message);
    throw err.message;
  }
}

export async function findWatchGroupsWithJoinedInformation(userId, page, limit, userLocLat, userLocLong,
  titleSearch, showSearch, creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch, sortBy) {
  try {
    let aqlParameters = {
      from: userId,
      offset: (page - 1) * limit,
      count: limit
    }
    let aqlQuery = `FOR doc IN watch_groups
    `;

    aqlQuery = addFilters(aqlQuery, aqlParameters, userLocLat, userLocLong,
      titleSearch, showSearch, creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch);
    aqlQuery = addSort(aqlQuery, aqlParameters, userLocLat, userLocLong, sortBy);

    aqlQuery += `
    LIMIT @offset, @count
    LET join = LENGTH(FOR edge IN joined_group
      FILTER edge._from == @from
      FILTER edge._to == doc._id
      LIMIT 1 RETURN true) > 0
    LET has_request = LENGTH(FOR edge IN join_request
      FILTER edge._from == @from
      FILTER edge._to == doc._id
      LIMIT 1 RETURN true) > 0
    RETURN { doc: UNSET(doc, "comments"), joined: join, has_request: has_request }`;
    const cursor = await pool.query(aqlQuery, aqlParameters);
    return await cursor.all();
  } catch (err) {
    console.log(err.message);
    throw err.message;
  }
}

export async function findWatchGroupsByCreator(creator, page, limit, userLocLat, userLocLong,
  titleSearch, showSearch, creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch, sortBy) {
  try {
    let aqlParameters = {
      creator: creator,
      offset: (page - 1) * limit,
      count: limit
    }
    let aqlQuery = `FOR doc IN watch_groups
    FILTER doc.creator == @creator
    `;

    // add filters and sort
    aqlQuery = addFilters(aqlQuery, aqlParameters, userLocLat, userLocLong,
      titleSearch, showSearch, creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch);
    aqlQuery = addSort(aqlQuery, aqlParameters, userLocLat, userLocLong, sortBy);

    aqlQuery += `
    LIMIT @offset, @count
    RETURN UNSET(doc, "comments")`;
    const cursor = await pool.query(aqlQuery, aqlParameters);
    return await cursor.all();
  } catch (err) {
    console.log(err.message);
    throw err.message;
  }
}

export async function findWatchGroupsByUserJoined(userId, page, limit, userLocLat, userLocLong,
  titleSearch, showSearch, creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch, sortBy) {
  try {
    let aqlParameters = {
      userId: userId,
      offset: (page - 1) * limit,
      count: limit
    }
    let aqlQuery = `FOR vertex IN OUTBOUND
    @userId joined_group
    `;

    // add filters and sort
    aqlQuery = addFilters(aqlQuery, aqlParameters, userLocLat, userLocLong,
      titleSearch, showSearch, creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch, 'vertex');
    aqlQuery = addSort(aqlQuery, aqlParameters, userLocLat, userLocLong, sortBy, 'vertex');

    aqlQuery += `
    LIMIT @offset, @count
    RETURN UNSET(vertex, "comments")`;
    const cursor = await pool.query(aqlQuery, aqlParameters);
    return await cursor.all();
  } catch (err) {
    console.log(err.message);
    throw err.message;
  }
}

export async function findWatchGroupNamesAndKeyByUserJoined(userId) {
  try {
    const aqlParameters = {
      userId: userId
    }
    const aqlQuery = `FOR vertex IN OUTBOUND
    @userId joined_group
    RETURN {name: vertex.title, wg_id: vertex._id}`;
    const cursor = await pool.query(aqlQuery, aqlParameters);
    return await cursor.all();
  } catch (err) {
    console.log(err.message);
    throw err.message;
  }
}

export async function findWatchGroupByKeyWithoutComments(key) {
  try {
    const aqlQuery = `FOR doc IN watch_groups
    FILTER doc._key == @key
    RETURN UNSET(doc, "comments")`;
    const cursor = await pool.query(aqlQuery, { key: key });
    return (await cursor.all())[0];
  } catch (err) {
    if (err.message == "no match") {
      console.log(`WatchGroup document with _key ${key} not found: `, err.message);
      return null;
    } else {
      console.log(err.message);
      throw err.message;
    }

  }
}

export async function findWatchGroupByKeyWithJoinedInformation(userId, key, page, limit) {
  try {
    const aqlQuery = `FOR doc IN watch_groups
    FILTER doc._key == @key
    LET join = LENGTH(FOR edge IN joined_group
      FILTER edge._from == @from
      FILTER edge._to == doc._id
      LIMIT 1 RETURN true) > 0
    LET has_request = LENGTH(FOR edge IN join_request
      FILTER edge._from == @from
      FILTER edge._to == doc._id
      LIMIT 1 RETURN true) > 0
    RETURN { 
    doc: {
      _key: doc._key,
      title: doc.title,
      creator: doc.creator,
      show: doc.show,
      description: doc.description,
      watch_date: doc.watch_date,
      location: doc.location,
      personLimit: doc.personLimit,
      currentNrOfPersons: doc.currentNrOfPersons,
      locationName: doc.locationName,
      creation_date: doc.creation_date,
      show_id: doc.show_id,
      show_type: doc.show_type,
      comments: (
        FOR comment in doc.comments
        SORT comment.creation_date DESC
        LIMIT @offset, @count
        RETURN comment
      )
    }, 
    joined: join,
    has_request: has_request }`;
    const cursor = await pool.query(aqlQuery, { from: userId, key: key, offset: (page - 1) * limit, count: limit });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err.message);
    throw err.message;
  }
}

export async function findWatchGroupByKey(key, page, limit) {
  try {
    const aqlQuery = `FOR doc IN watch_groups
    FILTER doc._key == @key
    RETURN { 
      _key: doc._key,
      title: doc.title,
      creator: doc.creator,
      show: doc.show,
      description: doc.description,
      watch_date: doc.watch_date,
      location: doc.location,
      personLimit: doc.personLimit,
      currentNrOfPersons: doc.currentNrOfPersons,
      locationName: doc.locationName,
      creation_date: doc.creation_date,
      show_id: doc.show_id,
      show_type: doc.show_type,
      comments: (
        FOR comment in doc.comments
        SORT comment.creation_date DESC
        LIMIT @offset, @count
        RETURN comment
      )
    }`;
    const cursor = await pool.query(aqlQuery, { key: key, offset: (page - 1) * limit, count: limit });
    return (await cursor.all())[0];
  } catch (err) {
    if (err.message == "no match") {
      console.log(`OpinionThread document with _key ${key} not found: `, err.message);
      return null;
    } else {
      console.log(err.message);
      throw err.message;
    }

  }
}


export async function getWatchGroupCount(userLocLat, userLocLong,
  titleSearch, showSearch, creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch) {
  try {
    let aqlParameters = {};
    let aqlQuery = `RETURN LENGTH(
      FOR doc IN watch_groups
      `
    aqlQuery = addFilters(aqlQuery, aqlParameters, userLocLat, userLocLong, titleSearch, showSearch,
      creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch);

    aqlQuery += `
        RETURN true)`;
    const cursor = await pool.query(aqlQuery, aqlParameters);
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err.message);
    throw err.message;
  }

}

export async function getWatchGroupCountByCreator(creator, userLocLat, userLocLong,
  titleSearch, showSearch, creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch) {
  try {
    let aqlParameters = { creator: creator };
    let aqlQuery = `RETURN LENGTH(
      FOR doc IN watch_groups
        FILTER doc.creator == @creator
      `
    aqlQuery = addFilters(aqlQuery, aqlParameters, userLocLat, userLocLong, titleSearch, showSearch,
      creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch);

    aqlQuery += `
        RETURN true)`;
    const cursor = await pool.query(aqlQuery, aqlParameters);
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err.message);
    throw err.message;
  }
}

export async function getWatchGroupCountByUserJoined(userId, userLocLat, userLocLong,
  titleSearch, showSearch, creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch) {
  try {
    let aqlParameters = { userId: userId };
    let aqlQuery = `RETURN LENGTH(
      FOR vertex IN OUTBOUND
      @userId joined_group
      `;

    aqlQuery = addFilters(aqlQuery, aqlParameters, userLocLat, userLocLong, titleSearch, showSearch,
      creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch, 'vertex');

    aqlQuery += `
        RETURN true)`;
    const cursor = await pool.query(aqlQuery, aqlParameters);
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err.message);
    throw err.message;
  }
}



export async function insertWatchGroup(watchGroupDocument) {
  try {
    const cursor = await watchGroupCollection.save(watchGroupDocument);
    return cursor._key;
  } catch (err) {
    console.log(err.message);
    throw err.message;
  }
}

export async function updateWatchGroup(key, newWatchGroupAttributes) {
  try {
    const cursor = await watchGroupCollection.update(key, newWatchGroupAttributes);
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Error for watchGroup document with _key ${key} during update request: `, err.message);
      return false;
    } else {
      console.log(err.message);
      throw err.message;
    }

  }
}

export async function deleteWatchGroup(key) {
  try {
    const cursor = await watchGroupCollection.remove({ _key: key });
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Warning for watchGroup document with _key ${key} during delete request: `, err.message);
      return false;
    } else {
      console.log(err.message);
      throw err.message;
    }

  }
}

export async function handleJoinTransaction(watchGroupKey, jwtUsername) {
  try {
    const transaction = await pool.beginTransaction({
      write: ["join_request", "joined_group", "watch_groups"],
      read: ["users"],
      allowImplicit: false
    });
    const watchGroup = await transaction.step(async () => {
      const aqlQuery = `FOR doc IN watch_groups
        FILTER doc._key == @key
        RETURN UNSET(doc, "comments")`;
      const cursor = await pool.query(aqlQuery, { key: watchGroupKey });
      return (await cursor.all())[0];
    });
    const usersCollection = pool.collection("users");

    const user = await transaction.step(async () => {
      return await usersCollection.firstExample({ username: jwtUsername });
    })

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

      if (joinEdgeExists) {
        // user is joined to the group -> leave request
        const deleted = await transaction.step(async () => {
          const aqlQuery = `FOR edge IN joined_group
            FILTER edge._from == @from
            FILTER edge._to == @to
            REMOVE { _key: edge._key } IN joined_group`;
          await pool.query(aqlQuery, { from: user._id, to: watchGroup._id });
          return true;
        });
        if (!deleted) {
          const transactionResult = await transaction.abort();
          console.log('Transaction for join request: ', transactionResult.status, '. Error during join delete');
          return {
            error: true,
            errorMessage: 'error_leave_try'
          }
        }
        // update persons joined count
        const updatedGroupPersonCount = await transaction.step(async () => {
          await watchGroupCollection.update(watchGroup._key, { currentNrOfPersons: watchGroup.currentNrOfPersons - 1 });
          return true;
        });
        if (!updatedGroupPersonCount) {
          const transactionResult = await transaction.abort();
          console.log('Transaction for join request: ', transactionResult.status, '. Error during join delete');
          return {
            error: true,
            errorMessage: 'error_leave_try'
          }
        }
        const transactionResult = await transaction.commit();
        console.log('Transaction for join request: ', transactionResult.status, '. Left the group');
        return {
          error: false,
          actionPerformed: 'deleted'
        };

      } else {
        // user is not joined to the group -> join request
        const joinRequestExists = await transaction.step(async () => {
          // check user already has a request
          const aqlQuery = `RETURN LENGTH(FOR doc IN join_request
            FILTER doc._from == @from
            FILTER doc._to == @to
            LIMIT 1 RETURN true) > 0`;
          const cursor = await pool.query(aqlQuery, { from: user._id, to: watchGroup._id });
          return (await cursor.all())[0];
        });

        if (!joinRequestExists) {

          if (watchGroup.currentNrOfPersons >= watchGroup.personLimit) {
            // the group is full
            const transactionResult = await transaction.abort();
            console.log('Transaction for join request: ', transactionResult.status, '. Group already full');
            return {
              error: true,
              errorMessage: 'error_group_full'
            }
          }
          // create join request
          const request_date = new Date(Date.now());
          const joinRequestKey = await transaction.step(async () => {
            const aqlQuery =
              `INSERT { 
                _from: @from, _to: @to, user: @user, about_user: @about_user, request_date: @request_date,
                group_name: @group_name
              } INTO join_request
              RETURN NEW._key`;
            const cursor = await pool.query(aqlQuery, {
              from: user._id, to: watchGroup._id, user: user.username,
              about_user: user.about_me, request_date: request_date,
              group_name: watchGroup.title
            });
            return (await cursor.all())[0];
          });
          const transactionResult = await transaction.commit();
          console.log('Transaction for join request: ', transactionResult.status,
            '. Request created with id', joinRequestKey);
          return {
            error: false,
            actionPerformed: 'created',
            joinRequestKey: joinRequestKey
          };
        }
        // request already exists
        const transactionResult = await transaction.commit();
        console.log('Transaction for join request: ', transactionResult.status,
          '. Request already exists');
        return {
          error: false,
          actionPerformed: 'request_exists'
        };
      }
    } else {
      // watchgroup or user not found
      const transactionResult = await transaction.abort();
      console.log('Transaction for join request: ', transactionResult.status, '. No group or user');
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