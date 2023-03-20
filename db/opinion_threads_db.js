import pool from './connection_db.js';

const opinionThreadCollection = pool.collection("opinion_threads");


export async function findOpinionThreads(page, limit) {
  try {
    const aqlQuery = `FOR doc IN opinion_threads
    LIMIT @offset, @count
    RETURN doc`;
    const cursor = await pool.query(aqlQuery, { offset: (page-1)*limit, count: limit });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findOpinionThreadByKey(key) {
  try {
    const cursor = await opinionThreadCollection.firstExample({_key: key});
    return cursor;
  } catch (err) {
    if (err.message == "no match") {
      console.log(`OpinionThread document with _key ${key} not found: ` ,err.message);
      return null;
    } else {
      console.log(err);
      throw err;
    }

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
      console.log(`Error for opinionThread document with _key ${key} during update request: ` ,err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function deleteOpinionThread(key) {
  try {
    const cursor = await opinionThreadCollection.remove({_key: key});
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Warning for opinionThread document with _key ${key} during delete request: `,err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}

