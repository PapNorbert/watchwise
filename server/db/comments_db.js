import pool from './connection_db.js'


export async function findComments(thread_id) {
  try {
    const aqlQuery = `FOR doc IN opinion_threads
    FILTER doc._key == @thread_key
    FOR comment in doc.comments
      RETURN comment`;
    const cursor = await pool.query(aqlQuery, { thread_key: thread_id });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findCommentByKey(thread_id, key) {
  try {
    const aqlQuery = `FOR doc IN opinion_threads
    FILTER doc._key == @thread_key
    FOR comment in doc.comments
      FILTER comment.key == @comment_id
      RETURN comment`;
    const cursor = await pool.query(aqlQuery, { thread_key: thread_id, comment_id: key });
    return await cursor.all();
  } catch (err) {
      console.log(err);
      throw err;
  }
}

export async function getCommentCountForThreadByKey(thread_id) {
  try {
    const aqlQuery = `RETURN LENGTH(
      FOR doc IN opinion_threads
        FILTER doc._key == @thread_key
        FOR comment in doc.comments
            RETURN true)`;
    const cursor = await pool.query(aqlQuery, { thread_key: thread_id });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}


export async function insertComment(thread_id, commentJson) {
  try {
    const aqlQuery = `FOR doc IN opinion_threads
    FILTER doc._key == @thread_key
    UPDATE doc WITH { comments: APPEND(doc.comments, @comment)} IN opinion_threads`;
    const cursor = await pool.query(aqlQuery, { thread_key: thread_id, comment: commentJson });
    return commentJson.key;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function deleteComment(thread_id, id) {
  try {
    const aqlQuery = `FOR doc IN opinion_threads
    FILTER doc._key == @thread_key
    FOR comment in doc.comments
    FILTER comment.key == @comment_id
        UPDATE doc WITH { comments: REMOVE_VALUE(doc.comments, comment)} IN opinion_threads
        RETURN true`;
    const cursor = await pool.query(aqlQuery, { thread_key: thread_id, comment_id: id });
    const deleted = await cursor.all();
    return deleted.length > 0;
  } catch (err) {
      console.log(err);
      throw err;
  }
}
