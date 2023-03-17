import pool from './connection_db.js';

const moviesCollection = pool.collection("movies");


export async function findMovies() {
  try {
    const cursor = await moviesCollection.all();
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findMovieByKey(key) {
  try {
    const cursor = await moviesCollection.firstExample({_key: key});
    return cursor;
  } catch (err) {
    if (err.message == "no match") {
      console.log(`Movie document with _key ${key} not found: ` ,err.message);
      return null;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function checkMovieExistsWithName(name) {
  try {
    const aqlQuery = `RETURN LENGTH(FOR doc IN movies
      FILTER doc.name == @name LIMIT 1 RETURN true) > 0`;
    const cursor = await pool.query(aqlQuery, { name: name });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function insertMovieAndGenreEdges(movieDocument, genres) {
  try {
    let aqlQuery = `INSERT @document INTO movies
    LET movieId = NEW._id 
    FOR genre IN genres
    FILTER genre.name == @genre0`;
    let bindVariables = {
      document: movieDocument,
      genre0: genres[0]
    };
    for (let i = 1; i < genres.length; i++) {
      aqlQuery += " || genre.name == @genre" + i;
      bindVariables["genre"+i] = genres[i];
    }
    aqlQuery += `\nINSERT { _from: movieId, _to: genre._id } INTO his_type
    RETURN movieId`;

    const cursor = await pool.query(aqlQuery, bindVariables);
    const id = await cursor.all();
    return id[0].split('/')[1]; 
        // returned the id multiple times because of multiple edge inserts, returns the key
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function updateMovie(key, newMovieAttributes) {
  try {
    const cursor = await moviesCollection.update(key, newMovieAttributes);
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Error for movie document with _key ${key} during update request: ` ,err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function deleteMovie(key) {
  try {
    const cursor = await moviesCollection.remove({_key: key});
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Warning for movie document with _key ${key} during delete request: `,err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function deleteMovieAndEdges(key) {
  try {
    const aqlQuery = `REMOVE {_key: @key } IN movies
    FOR edge in his_type
        FILTER edge._from == @from
        REMOVE edge IN his_type`;
    const cursor = await pool.query(aqlQuery, { key: key, from: ("movies/"+key) });
    return true;
  } catch (err) {
    if (err.message == "AQL: document not found (while executing)") {
      console.log(`Warning for movie document with _key ${key} during delete request: `,err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}
