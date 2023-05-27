import pool from './connection_db.js'

const watchGroupChatCollection = pool.collection("watch_group_chats");
//const hisGroupChatEdgeCollection = pool.collection("his_group_chat");


export async function findWatchGroupChatByWGKey(wgId) {
  try {
    let aqlParameters = {
      key: wgId
    };
    let aqlQuery = `FOR edge IN his_group_chat
    FILTER edge._from == @key
    FOR doc IN watch_group_chats
      FILTER doc._id == edge._to
      FOR comment in doc.chat_comments
        SORT comment.created_at DESC
        RETURN comment`;
    const cursor = await pool.query(aqlQuery, aqlParameters);
    return await cursor.all();
  } catch (err) {
    throw err.message;
  }
}

export async function insertWatchGroupChat(watchGroupChatDocument) {
  try {
    const cursor = await watchGroupChatCollection.save(watchGroupChatDocument);
    return cursor._key;
  } catch (err) {
    console.log(err.message);
    throw err.message;
  }
}


export async function insertHisGroupChatEdge(wgId, whChatId) {
  try {
    const aqlQuery = `INSERT { 
      _from: @from, _to: @to 
    } INTO his_group_chat
    RETURN NEW._key`;
    console.log(aqlQuery,  { from: wgId, to: whChatId })
    const cursor = await pool.query(aqlQuery, { from: wgId, to: whChatId });
    return (await cursor.all())[0];
  } catch (err) {
    throw err.message;
  }
}

export async function insertWatchGroupChatComment(wgId, commentJson) {
  try {
    const aqlQuery = `FOR edge IN his_group_chat
    FILTER edge._from == @key
    FOR doc IN watch_group_chats
      FILTER doc._id == edge._to
      UPDATE doc WITH { chat_comments: APPEND(doc.chat_comments, @comment)} IN watch_group_chats`;
    await pool.query(aqlQuery, { key: wgId, comment: commentJson });
    return commentJson.key;
  } catch (err) {
    throw err.message;
  }
}
