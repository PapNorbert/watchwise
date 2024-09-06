import pool from './connection_db.js'

const seriesCollection = pool.collection("series");


export async function findSeries(page, limit) {
  try {
    const aqlQuery = `FOR doc IN series
    SORT doc.name
    LIMIT @offset, @count
    RETURN doc`;
    const cursor = await pool.query(aqlQuery, { offset: (page - 1) * limit, count: limit });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findSeriesShort(page, limit) {
  try {
    const aqlQuery = `FOR doc IN series
    SORT doc.name
    LIMIT @offset, @count
    LET genres = (
      FOR edge in his_type
      FILTER edge._from == doc._id
      FOR genre in genres
        FILTER genre._id == edge._to
        RETURN genre.name
    )
    RETURN { 
      _key: doc._key,
      title: doc.name, 
      nr_seasons: doc.nr_seasons, 
      nr_episodes: doc.nr_episodes, 
      release_date: doc.original_release,
      img_name: doc.img_name,
      genres: genres,
      average_rating: doc.average_rating,
      total_ratings: doc.total_ratings
    }`;
    const cursor = await pool.query(aqlQuery, { offset: (page - 1) * limit, count: limit });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findSeriesShortByGenreType(page, limit, genreId) {
  try {
    const aqlQuery = `FOR doc IN INBOUND
    @genreId his_type
    FILTER CONTAINS(doc._id, "series")
    SORT doc.name
    LIMIT @offset, @count
    LET genres = (
      FOR edge in his_type
      FILTER edge._from == doc._id
      FOR genre in genres
        FILTER genre._id == edge._to
        RETURN genre.name
    )
    RETURN { 
      _key: doc._key,
      title: doc.name, 
      nr_seasons: doc.nr_seasons, 
      nr_episodes: doc.nr_episodes, 
      release_date: doc.original_release,
      img_name: doc.img_name,
      genres: genres
    }`;
    const cursor = await pool.query(aqlQuery, { offset: (page - 1) * limit, count: limit, genreId: genreId });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findSeriesShortByNameContains(page, limit, name) {
  try {
    const aqlQuery = `FOR doc IN series
    FILTER CONTAINS(UPPER(doc.name), @nameFilter)
    SORT doc.name
    LIMIT @offset, @count
    LET genres = (
      FOR edge in his_type
      FILTER edge._from == doc._id
      FOR genre in genres
        FILTER genre._id == edge._to
        RETURN genre.name
    )
    RETURN { 
      _key: doc._key,
      title: doc.name, 
      nr_seasons: doc.nr_seasons, 
      nr_episodes: doc.nr_episodes, 
      release_date: doc.original_release,
      img_name: doc.img_name,
      genres: genres
    }`;
    const cursor = await pool.query(aqlQuery, { offset: (page - 1) * limit, count: limit, nameFilter: name });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findSeriesByKey(key) {
  try {
    const cursor = await seriesCollection.firstExample({ _key: key });
    return cursor;
  } catch (err) {
    if (err.message == "no match") {
      console.log(`Series document with _key ${key} not found: `, err.message);
      return null;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function findSeriesByName(name) {
  try {
    const cursor = await seriesCollection.firstExample({ name: name });
    return cursor;
  } catch (err) {
    if (err.message == "no match") {
      console.log(`Series document with name ${name} not found: `, err.message);
      return null;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function getSeriesCount() {
  try {
    const cursor = await seriesCollection.count();
    return cursor.count;
  } catch (err) {
    console.log(err);
    throw err;
  }

}

export async function getSeriesCountByGenre(genreId) {
  try {
    const aqlQuery = `RETURN LENGTH(FOR vertex IN INBOUND
      @genreId his_type
      FILTER CONTAINS(vertex._id, "series")
      RETURN true)`;
    const cursor = await pool.query(aqlQuery, { genreId: genreId });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }

}

export async function getSeriesCountByNameContains(name) {
  try {
    const aqlQuery = `RETURN LENGTH(FOR doc IN series
      FILTER CONTAINS(UPPER(doc.name), @nameFilter)
      RETURN true)`;
    const cursor = await pool.query(aqlQuery, { nameFilter: name });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }

}

export async function getSerieKeyByName(name) {
  try {
    const aqlQuery = `FOR doc in series
    FILTER doc.name == @name
    return doc._key`;
    const cursor = await pool.query(aqlQuery, { name: name });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function checkSeriesExistsWithName(name) {
  try {
    const aqlQuery = `RETURN LENGTH(FOR doc IN series
      FILTER doc.name == @name LIMIT 1 RETURN true) > 0`;
    const cursor = await pool.query(aqlQuery, { name: name });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function insertSeriesAndGenreEdges(seriesDocument, genres) {
  try {
    let aqlQuery = `INSERT @document INTO series
    LET seriesId = NEW._id 
    FOR genre IN genres
    FILTER genre.name == @genre0`;
    let bindVariables = {
      document: seriesDocument,
      genre0: genres[0]
    };
    for (let i = 1; i < genres.length; i++) {
      aqlQuery += " || genre.name == @genre" + i;
      bindVariables["genre" + i] = genres[i];
    }
    aqlQuery += `\nINSERT { _from: seriesId, _to: genre._id } INTO his_type
    RETURN seriesId`;

    const cursor = await pool.query(aqlQuery, bindVariables);
    const id = await cursor.all();
    return id[0].split('/')[1];
    // returned the id multiple times because of multiple edge inserts, returns the key
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function updateSeries(key, newSeriesAttributes) {
  try {
    const cursor = await seriesCollection.update(key, newSeriesAttributes);
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Error for series document with _key ${key} during update request: `, err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function deleteSeries(key) {
  try {
    const cursor = await seriesCollection.remove({ _key: key });
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Warning for series document with _key ${key} during delete request: `, err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function deleteSeriesAndEdges(key) {
  try {
    const aqlQuery = `REMOVE {_key: @key } IN series
    FOR edge in his_type
        FILTER edge._from == @from
        REMOVE edge IN his_type`;
    const cursor = await pool.query(aqlQuery, { key: key, from: ("series/" + key) });
    return true;
  } catch (err) {
    if (err.message == "AQL: document not found (while executing)") {
      console.log(`Warning for series document with _key ${key} during delete request: `, err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}
