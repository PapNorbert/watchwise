import pool from './connection_db.js'


export async function findRecommendations(showKey, limit) {
  try {
    const aqlQuery = `
    LET targetEmbedding = (
      FOR e IN embeddings
        FILTER e.show_key == @targetShowKey
        RETURN e.embedding_vector
      )[0]
      
    FOR e IN embeddings
    // Exclude the target show itself
    FILTER e.show_key != @targetShowKey
    LET similarity = COSINE_SIMILARITY(targetEmbedding, e.embedding_vector)
    SORT similarity DESC
    LIMIT @count
    RETURN {
      show_key: e.show_key,
      show_type: e.show_type,
      show_name: e.show_name,
      img_name: HAS(e, 'img_name') ? e.img_name : null,
      similarity: similarity
    }
    `;
    const cursor = await pool.query(aqlQuery, { targetShowKey: showKey, count: limit });
    return (await cursor.all());
  } catch (err) {
    console.log(err);
    throw err;
  }
}
