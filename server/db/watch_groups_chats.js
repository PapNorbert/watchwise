import getPool from './connection_db.js';
import { findWatchGroupByKeyWithoutComments, updateWatchGroup } from './watch_groups_db.js';
import { updateJoinedGroup } from './joined_group_db.js'

let watchGroupChatCollection;

async function initializeCollection() {
  const pool = await getPool();
  watchGroupChatCollection = pool.collection("watch_group_chats");
}

initializeCollection();

export async function updateLastOpenedChatByUser(userId, userName, watchGroupId) {
  try {
    const watchGroup = await findWatchGroupByKeyWithoutComments(watchGroupId.split('/')[1]);
    if (watchGroup) {
      if (watchGroup.creator === userName) {

        await updateWatchGroup(watchGroupId.split('/')[1], { creatorLastOpenedDate: new Date(Date.now()) });
      } else {
        await updateJoinedGroup(`users/${userId}`, { lastOpenedDate: new Date(Date.now()) });
      }
    }
  } catch (err) {
    console.log(err.message);
  }
}



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
        RETURN comment`;
    const pool = await getPool();
    const cursor = await pool.query(aqlQuery, aqlParameters);
    return await cursor.all();
  } catch (err) {
    throw err.message;
  }
}

export async function insertWatchGroupChat(watchGroupChatDocument) {
  try {
    if (!watchGroupChatCollection) {
      await initializeCollection();
    }
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
    const pool = await getPool();
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
    const pool = await getPool();
    await pool.query(aqlQuery, { key: wgId, comment: commentJson });
    return commentJson.key;
  } catch (err) {
    throw err.message;
  }
}
