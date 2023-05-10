import pool from './connection_db.js'



export async function findJoinRequestByCreator(creator, page, limit) {
  try {
    const aqlQuery = `FOR group IN watch_groups
    FILTER group.creator == @creator
      FOR doc IN join_request
      FILTER doc._to == group._id
    LIMIT @offset, @count
    RETURN doc`;
    const cursor = await pool.query(aqlQuery, { creator: creator, offset: (page - 1) * limit, count: limit });
    return await cursor.all();
  } catch (err) {
    throw err.message;
  }
}

export async function getJoinRequestCountByCreator(creator) {
  try {
    const aqlQuery = `RETURN LENGTH(
    FOR group IN watch_groups
    FILTER group.creator == @creator
      FOR doc IN join_request
      FILTER doc._from == group._id
        RETURN true)`;
    const cursor = await pool.query(aqlQuery, { creator: creator });
    return (await cursor.all())[0];
  } catch (err) {
    throw err.message;
  }
}

export async function deleteJoinRequestEdge(from, to) {
  try {
    const aqlQuery = `FOR edge IN join_request
    FILTER edge._from == @from
    FILTER edge._to == @to
    REMOVE { _key: edge._key } IN join_request`;
    const cursor = await pool.query(aqlQuery, { from: from, to: to });
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Warning for join request edge during delete request: `, err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}