import pool from './connection_db.js'



export async function checkEdgeExists(from, to) {
  try {
    const aqlQuery = `RETURN LENGTH(FOR doc IN follows_thread
      FILTER doc._from == @from
      FILTER doc._to == @to
      LIMIT 1 RETURN true) > 0`;
    const cursor = await pool.query(aqlQuery, { from: from, to: to });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function insertFollowedEdge(from, to) {
  try {
    const aqlQuery = `INSERT { _from: @from, _to: @to } INTO follows_thread`;
    const cursor = await pool.query(aqlQuery, { from: from, to: to });
    return cursor._key;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function deleteFollowedEdge(from, to) {
  try {
    const aqlQuery = `FOR edge IN follows_thread
    FILTER edge._from == @from
    FILTER edge._to == @to
    REMOVE { _key: edge._key } IN follows_thread`;
    const cursor = await pool.query(aqlQuery, { from: from, to: to });
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Warning for follow edge during delete request: `, err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}
