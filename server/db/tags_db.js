import getPool from './connection_db.js';


export async function findTags(limit) {
  try {
    const aqlQuery = `FOR tag IN tags
      LIMIT @count
      RETURN tag.name`;
    const pool = await getPool();
    const cursor = await pool.query(aqlQuery, { count: limit });
    return (await cursor.all());
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findFilteredTags(nameFilter, limit) { 
  try {
    const aqlQuery = `FOR tag IN tags
    FILTER CONTAINS(UPPER(tag.name), @nameFilter)
    LIMIT @count
    RETURN tag.name `;
    const pool = await getPool();
    const cursor = await pool.query(aqlQuery, { nameFilter: nameFilter, count: limit });
    return (await cursor.all());
  } catch (err) {
    console.log(err);
    throw err;
  }
}