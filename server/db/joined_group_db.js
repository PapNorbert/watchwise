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
