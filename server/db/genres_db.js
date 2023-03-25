import pool from './connection_db.js'

const genresCollection = pool.collection("genres");


export async function findGenres(page, limit) {
  try {
    const aqlQuery = `FOR doc IN genres
    LIMIT @offset, @count
    RETURN doc`;
    const cursor = await pool.query(aqlQuery, { offset: (page-1)*limit, count: limit });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findGenreByKey(key) {
  try {
    const cursor = await genresCollection.firstExample({_key: key});
    return cursor;
  } catch (err) {
    if (err.message == "no match") {
      console.log(`Genre document with _key ${key} not found: ` ,err.message);
      return null;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function getGenreCount() {
  try {
    const cursor = await genresCollection.count();
    return cursor.count;
  } catch (err) {
      console.log(err);
      throw err;
    }

}

export async function insertGenre(genreDocument) {
  try {
    const cursor = await genresCollection.save(genreDocument);
    return cursor._key;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function updateGenre(key, newGenreAttributes) {
  try {
    const cursor = await genresCollection.update(key, newGenreAttributes);
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Error for genre document with _key ${key} during update request: ` ,err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function deleteGenre(key) {
  try {
    const cursor = await genresCollection.remove({_key: key});
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Warning for genre document with _key ${key} during delete request: `,err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function deleteGenreAndEdges(key) {
  try {
    const aqlQuery = `REMOVE {_key: @key } IN genres
    FOR edge in his_type
        FILTER edge._to == @to
        REMOVE edge IN his_type`;
    const cursor = await pool.query(aqlQuery, { key: key, to: ("genres/"+key) });
    return true;
  } catch (err) {
    if (err.message == "AQL: document not found (while executing)") {
      console.log(`Warning for genre document with _key ${key} during delete request: `,err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}
