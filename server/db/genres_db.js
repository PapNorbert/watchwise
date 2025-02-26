import getPool from './connection_db.js';

let genresCollection;

async function initializeCollection() {
  const pool = await getPool();
  genresCollection = pool.collection("genres");
}

initializeCollection();

export async function findAllGenres() {
  try {
    const pool = await getPool();
    const cursor = await pool.query(`
      FOR genre IN genres
      SORT genre.name ASC
      RETURN genre
    `);
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findGenres(page, limit) {
  try {
    const aqlQuery = `FOR doc IN genres
    LIMIT @offset, @count
    RETURN doc`;
    const pool = await getPool();
    const cursor = await pool.query(aqlQuery, { offset: (page - 1) * limit, count: limit });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findGenreByKey(key) {
  try {
    if (!genresCollection) {
      await initializeCollection();
    }
    const cursor = await genresCollection.firstExample({ _key: key });
    return cursor;
  } catch (err) {
    if (err.message == "no match") {
      console.log(`Genre document with _key ${key} not found: `, err.message);
      return null;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function findGenreByHisTypeEdgeFrom(from) {
  try {
    const aqlQuery = `FOR edge in his_type
    FILTER edge._from == @from
    FOR doc in genres
      FILTER doc._id == edge._to
      RETURN doc`;
    const pool = await getPool();
    const cursor = await pool.query(aqlQuery, { from: from });
    return await cursor.all();
  } catch (err) {
    throw err.message;
  }
}

export async function getGenreCount() {
  try {
    if (!genresCollection) {
      await initializeCollection();
    }
    const cursor = await genresCollection.count();
    return cursor.count;
  } catch (err) {
    console.log(err);
    throw err;
  }

}

export async function insertGenre(genreDocument) {
  try {
    if (!genresCollection) {
      await initializeCollection();
    }
    const cursor = await genresCollection.save(genreDocument);
    return cursor._key;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function updateGenre(key, newGenreAttributes) {
  try {
    if (!genresCollection) {
      await initializeCollection();
    }
    const cursor = await genresCollection.update(key, newGenreAttributes);
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Error for genre document with _key ${key} during update request: `, err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function deleteGenre(key) {
  try {
    if (!genresCollection) {
      await initializeCollection();
    }
    const cursor = await genresCollection.remove({ _key: key });
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Warning for genre document with _key ${key} during delete request: `, err.message);
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
    const pool = await getPool();
    const cursor = await pool.query(aqlQuery, { key: key, to: ("genres/" + key) });
    return true;
  } catch (err) {
    if (err.message == "AQL: document not found (while executing)") {
      console.log(`Warning for genre document with _key ${key} during delete request: `, err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}
