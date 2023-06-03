import pool from './connection_db.js'



export async function getJoinedUsersByGroupKey(watchGroupKey) {
  try {
    const aqlQuery = `FOR doc IN watch_groups
    FILTER doc._key == @watchGroupKey
        FOR vertex IN INBOUND
          doc._id joined_group
          RETURN vertex.username`;
    const cursor = await pool.query(aqlQuery, { watchGroupKey: watchGroupKey });
    return (await cursor.all());
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function updateJoinedGroup(userId, newJoinedGroupAttributes) {
  try {
    const aqlQuery = `FOR edge IN joined_group
    FILTER edge._from == @from
      UPDATE edge._key WITH @newJoinedGroupAttributes in joined_group`;
    await pool.query(aqlQuery, { from: userId, newJoinedGroupAttributes: newJoinedGroupAttributes });
    return true;
  } catch (err) {
      console.log(err.message);
      throw err.message;
    }
}

export async function deleteJoinedGroupEdgeByTo(to) {
  try {
    const aqlQuery = `FOR edge IN joined_group
    FILTER edge._to == @to
    REMOVE { _key: edge._key } IN joined_group`;
    const cursor = await pool.query(aqlQuery, { to: to });
    return true;
  } catch (err) {
    if (err.message == "AQL: document not found (while executing)") {
      console.log(`Warning for joinedGroupEdge document with _key ${key} during delete request: `, err.message);
      return false;
    } else {
      throw err.message;
    }

  }
}