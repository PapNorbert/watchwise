import pool from './connection_db.js'


export async function insertIsAboutShowEdge(from, to) {
  try {
    const aqlQuery = `INSERT { _from: @from, _to: @to } INTO is_about_show`;
    const cursor = await pool.query(aqlQuery, { from: from, to: to });
    return cursor._key;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function deleteIsAboutShowEdge(from, to) {
  try {
    const aqlQuery = `FOR edge IN is_about_show
    FILTER edge._from == @from
    REMOVE { _key: edge._key } IN is_about_show`;
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
