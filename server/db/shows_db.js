import pool from './connection_db.js'


export async function findShows(limit) {
  try {
    const aqlQuery = `LET movies = (
      FOR doc1 in movies
      LIMIT @count
      RETURN doc1.name
  )
  let series = (
      FOR doc2 in series
      LIMIT @count
      RETURN doc2.name
      )
  RETURN UNION(movies, series)
  `;
    const cursor = await pool.query(aqlQuery, { count: limit });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findFilteredShows(nameFilter, limit) {
  try {
    const aqlQuery = `LET movies = (
      FOR doc1 in movies
      FILTER CONTAINS(UPPER(doc1.name), @nameFilter)
      LIMIT @count
      RETURN doc1.name
  )
  let series = (
      FOR doc2 in series
      FILTER CONTAINS(UPPER(doc2.name), @nameFilter)
      LIMIT @count
      RETURN doc2.name
      )
  RETURN UNION(movies, series)
  `;
    const cursor = await pool.query(aqlQuery, { nameFilter: nameFilter, count: limit });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}