import pool from './connection_db.js'

const watchGroupCollection = pool.collection("watch_groups");


export async function findWatchGroups(page, limit) {
  try {
    const aqlQuery = `FOR doc IN watch_groups
    LIMIT @offset, @count
    RETURN UNSET(doc, "comments")`;
    const cursor = await pool.query(aqlQuery, { offset: (page - 1) * limit, count: limit });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findWatchGroupsAndDistance(page, limit, userLocLat, userLocLong) {
  try {
    const aqlQuery = `FOR doc IN watch_groups
    SORT DISTANCE(doc.location[0], doc.location[1], @userLocLat, @userLocLong)
    LIMIT @offset, @count
    RETURN UNSET(doc, "comments")`;
    const cursor = await pool.query(aqlQuery,
      { offset: (page - 1) * limit, count: limit, userLocLat: userLocLat, userLocLong: userLocLong });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findWatchGroupsWithJoinedInformation(userId, page, limit) {
  try {
    const aqlQuery = `FOR doc IN watch_groups
    LIMIT @offset, @count
    LET join = LENGTH(FOR edge IN joined_group
      FILTER edge._from == @from
      FILTER edge._to == doc._id
      LIMIT 1 RETURN true) > 0
    RETURN { doc: UNSET(doc, "comments"), joined: join }`;
    const cursor = await pool.query(aqlQuery, { from: userId, offset: (page - 1) * limit, count: limit });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findWatchGroupsWithJoinedInformationAndDistance(userId, page, limit, userLocLat, userLocLong) {
  try {
    const aqlQuery = `FOR doc IN watch_groups
    SORT DISTANCE(doc.location[0], doc.location[1], @userLocLat, @userLocLong)
    LIMIT @offset, @count
    LET join = LENGTH(FOR edge IN joined_group
      FILTER edge._from == @from
      FILTER edge._to == doc._id
      LIMIT 1 RETURN true) > 0
    RETURN { doc: UNSET(doc, "comments"), joined: join }`;
    const cursor = await pool.query(aqlQuery,
      { from: userId, offset: (page - 1) * limit, count: limit, userLocLat: userLocLat, userLocLong: userLocLong });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findWatchGroupsByCreator(creator, page, limit) {
  try {
    const aqlQuery = `FOR doc IN watch_groups
    FILTER doc.creator == @creator
    LIMIT @offset, @count
    RETURN UNSET(doc, "comments")`;
    const cursor = await pool.query(aqlQuery, { creator: creator, offset: (page - 1) * limit, count: limit });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findWatchGroupsByCreatorAndDistance(creator, page, limit, userLocLat, userLocLong) {
  try {
    const aqlQuery = `FOR doc IN watch_groups
    FILTER doc.creator == @creator
    SORT DISTANCE(doc.location[0], doc.location[1], @userLocLat, @userLocLong)
    LIMIT @offset, @count
    RETURN UNSET(doc, "comments")`;
    const cursor = await pool.query(aqlQuery,
      { creator: creator, offset: (page - 1) * limit, count: limit, userLocLat: userLocLat, userLocLong: userLocLong });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findWatchGroupsByUserJoined(userId, page, limit) {
  try {
    const aqlQuery = `FOR vertex IN OUTBOUND
    @userId joined_group
    LIMIT @offset, @count
    RETURN UNSET(vertex, "comments")`;
    const cursor = await pool.query(aqlQuery, { userId: userId, offset: (page - 1) * limit, count: limit });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findWatchGroupsByUserJoinedAndDistance(userId, page, limit, userLocLat, userLocLong) {
  try {
    const aqlQuery = `FOR vertex IN OUTBOUND
    @userId joined_group
    SORT DISTANCE(vertex.location[0], vertex.location[1], @userLocLat, @userLocLong)
    LIMIT @offset, @count
    RETURN UNSET(vertex, "comments")`;
    const cursor = await pool.query(aqlQuery,
      { userId: userId, offset: (page - 1) * limit, count: limit, userLocLat: userLocLat, userLocLong: userLocLong });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
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
      console.log(err);
      throw err;
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
    RETURN { 
    doc: {
      _key: doc._key,
      title: doc.title,
      creator: doc.creator,
      show: doc.show,
      description: doc.description,
      watch_date: doc.watch_date,
      location: doc.location,
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
    joined: join }`;
    const cursor = await pool.query(aqlQuery, { from: userId, key: key, offset: (page - 1) * limit, count: limit });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
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
      console.log(err);
      throw err;
    }

  }
}


export async function getWatchGroupCount() {
  try {
    const cursor = await watchGroupCollection.count();
    return cursor.count;
  } catch (err) {
    console.log(err);
    throw err;
  }

}

export async function getWatchGroupCountByCreator(creator) {
  try {
    const aqlQuery = `RETURN LENGTH(
      FOR doc IN watch_groups
        FILTER doc.creator == @creator
        RETURN true)`;
    const cursor = await pool.query(aqlQuery, { creator: creator });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function getWatchGroupCountByUserJoined(userId) {
  try {
    const aqlQuery = `RETURN LENGTH(
      FOR vertex IN OUTBOUND
      @userId joined_group
        RETURN true)`;
    const cursor = await pool.query(aqlQuery, { userId: userId });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}



export async function insertWatchGroup(watchGroupDocument) {
  try {
    const cursor = await watchGroupCollection.save(watchGroupDocument);
    return cursor._key;
  } catch (err) {
    console.log(err);
    throw err;
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
      console.log(err);
      throw err;
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
      console.log(err);
      throw err;
    }

  }
}

