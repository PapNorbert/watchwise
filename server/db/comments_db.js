import pool from './connection_db.js'


export async function findComments(id, collectionName) {
  try {
    const aqlQuery = `FOR doc IN @@collection
    FILTER doc._key == @key
    FOR comment in doc.comments
      RETURN comment`;
    const cursor = await pool.query(aqlQuery, { key: id, '@collection': collectionName });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findCommentByKey(id, comment_id, collectionName) {
  try {
    const aqlQuery = `FOR doc IN @@collection
    FILTER doc._key == @key
    FOR comment in doc.comments
      FILTER comment.key == @comment_id
      RETURN comment`;
    const cursor = await pool.query(aqlQuery, { key: id, comment_id: comment_id, '@collection': collectionName });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function getCommentCountForThreadByKey(id) {
  try {
    const aqlQuery = `RETURN LENGTH(
      FOR doc IN opinion_threads
        FILTER doc._key == @key
        FOR comment in doc.comments
            RETURN true)`;
    const cursor = await pool.query(aqlQuery, { key: id });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function getCommentCountForGroupByKey(id) {
  try {
    const aqlQuery = `RETURN LENGTH(
      FOR doc IN watch_groups
        FILTER doc._key == @key
        FOR comment in doc.comments
            RETURN true)`;
    const cursor = await pool.query(aqlQuery, { key: id });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function insertComment(id, commentJson, collectionName) {
  try {
    const aqlQuery = `FOR doc IN @@collection
    FILTER doc._key == @key
    UPDATE doc WITH { comments: APPEND(doc.comments, @comment)} IN @@collection`;
    const cursor = await pool.query(aqlQuery, { key: id, comment: commentJson, '@collection': collectionName });
    return commentJson.key;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function updateComment(id, comment_id, newTextValue, collectionName) {
  try {
    const aqlQuery = `FOR doc IN @@collection
    FILTER doc._key == @key
    LET newComments = (
      FOR comment in doc.comments
        LET newItem = ( !(comment.key == @comment_id) ?
          comment :
          MERGE(comment, { text: @newTextValue })
        )
        RETURN newItem)
    UPDATE doc WITH { comments: newComments} IN @@collection
    RETURN true`;
    const cursor = await pool.query(aqlQuery, {
      key: id, comment_id: comment_id, newTextValue, '@collection': collectionName
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function deleteComment(id, comment_id, collectionName) {
  try {
    const aqlQuery = `FOR doc IN @@collection
    FILTER doc._key == @key
    FOR comment in doc.comments
      FILTER comment.key == @comment_id
          UPDATE doc WITH { comments: REMOVE_VALUE(doc.comments, comment)} IN @@collection
          RETURN true`;
    const cursor = await pool.query(aqlQuery, { key: id, comment_id: comment_id, '@collection': collectionName});
    const deleted = await cursor.all();
    return deleted.length > 0;
  } catch (err) {
    console.log(err);
    return false;
  }
}
