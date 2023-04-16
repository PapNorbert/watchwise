import pool from './connection_db.js'

const opinionThreadCollection = pool.collection("opinion_threads");


export async function findOpinionThreads(page, limit) {
  try {
    const aqlQuery = `FOR doc IN opinion_threads
    LIMIT @offset, @count
    RETURN UNSET(doc, "comments")`;
    const cursor = await pool.query(aqlQuery, { offset: (page - 1) * limit, count: limit });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findOpinionThreadsWithFollowedInformation(userId, page, limit) {
  try {
    const aqlQuery = `FOR doc IN opinion_threads
    LIMIT @offset, @count
    LET follow = LENGTH(FOR edge IN follows_thread
      FILTER edge._from == @from
      FILTER edge._to == doc._id
      LIMIT 1 RETURN true) > 0
    RETURN { doc: UNSET(doc, "comments"), followed: follow }`;
    const cursor = await pool.query(aqlQuery, { from: userId, offset: (page - 1) * limit, count: limit });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findOpinionThreadsByCreator(creator, page, limit) {
  try {
    const aqlQuery = `FOR doc IN opinion_threads
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

export async function findOpinionThreadsByUserFollowed(userId, page, limit) {
  try {
    const aqlQuery = `FOR vertex IN OUTBOUND
    @userId follows_thread
    LIMIT @offset, @count
    RETURN UNSET(vertex, "comments")`;
    const cursor = await pool.query(aqlQuery, { userId: userId, offset: (page - 1) * limit, count: limit });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findOpinionThreadByKeyWithoutComments(key) {
  try {
    const aqlQuery = `FOR doc IN opinion_threads
    FILTER doc._key == @key
    RETURN UNSET(doc, "comments")`;
    const cursor = await pool.query(aqlQuery, { key: key });
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

export async function findOpinionThreadByKey(key, page, limit) {
  try {
    const aqlQuery = `FOR doc IN opinion_threads
    FILTER doc._key == @key
    RETURN { 
      _key: doc._key,
      creation_date: doc.creation_date,
      creator: doc.creator,
      description: doc.description,
      show: doc.show,
      show_id: doc.show_id,
      show_type: doc.show_type,
      title: doc.title,
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

export async function findOpinionThreadByKeyWithFollowedInformation(userId, key, page, limit) {
  try {
    const aqlQuery = `FOR doc IN opinion_threads
    FILTER doc._key == @key
    LET follow = LENGTH(FOR edge IN follows_thread
      FILTER edge._from == @from
      FILTER edge._to == doc._id
      LIMIT 1 RETURN true) > 0
    RETURN { 
    doc: {
      _key: doc._key,
      creation_date: doc.creation_date,
      creator: doc.creator,
      description: doc.description,
      show: doc.show,
      show_id: doc.show_id,
      show_type: doc.show_type,
      title: doc.title,
      comments: (
        FOR comment in doc.comments
        SORT comment.creation_date DESC
        LIMIT @offset, @count
        RETURN comment
      )
    }, 
    followed: follow }`;
    const cursor = await pool.query(aqlQuery, { from: userId, key: key, offset: (page - 1) * limit, count: limit });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function getOpinionThreadCount() {
  try {
    const cursor = await opinionThreadCollection.count();
    return cursor.count;
  } catch (err) {
    console.log(err);
    throw err;
  }

}

export async function getOpinionThreadCountByCreator(creator) {
  try {
    const aqlQuery = `RETURN LENGTH(
      FOR doc IN opinion_threads
        FILTER doc.creator == @creator
        RETURN true)`;
    const cursor = await pool.query(aqlQuery, { creator: creator });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function getOpinionThreadCountByUserFollowed(userId) {
  try {
    const aqlQuery = `RETURN LENGTH(
      FOR vertex IN OUTBOUND
      @userId follows_thread
        RETURN true)`;
    const cursor = await pool.query(aqlQuery, { userId: userId });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function insertOpinionThread(opinionThreadDocument) {
  try {
    const cursor = await opinionThreadCollection.save(opinionThreadDocument);
    return cursor._key;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function updateOpinionThread(key, newOpinionThreadAttributes) {
  try {
    const cursor = await opinionThreadCollection.update(key, newOpinionThreadAttributes);
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Error for opinionThread document with _key ${key} during update request: `, err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function deleteOpinionThread(key) {
  try {
    const cursor = await opinionThreadCollection.remove({ _key: key });
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Warning for opinionThread document with _key ${key} during delete request: `, err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}

