import pool from './connection_db.js';

const watchGroupCollection = pool.collection("watch_groups");


export async function findWatchGroups() {
  try {
    const cursor = await watchGroupCollection.all();
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findWatchGroupByKey(key) {
  try {
    const cursor = await watchGroupCollection.firstExample({_key: key});
    return cursor;
  } catch (err) {
    if (err.message == "no match") {
      console.log(`WatchGroup document with _key ${key} not found: ` ,err.message);
      return null;
    } else {
      console.log(err);
      throw err;
    }

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
      console.log(`Error for watchGroup document with _key ${key} during update request: ` ,err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function deleteWatchGroup(key) {
  try {
    const cursor = await watchGroupCollection.remove({_key: key});
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Warning for watchGroup document with _key ${key} during delete request: `,err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}

