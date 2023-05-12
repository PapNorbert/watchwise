import pool from './connection_db.js'
import { sortTypesOT } from '../config/sortTypes.js'

const opinionThreadCollection = pool.collection("opinion_threads");


export async function findOpinionThreads(page, limit, titleSearch, showSearch, creatorSearch, sortBy) {
  try {
    let aqlParameters = {
      offset: (page - 1) * limit,
      count: limit
    }
    let aqlQuery = `FOR doc IN opinion_threads
    `
    // add filters and sort
    if (titleSearch) {
      aqlQuery += `
      FILTER CONTAINS(UPPER(doc.title), @titleFilter)
      `;
      aqlParameters.titleFilter = titleSearch.toUpperCase();
    }
    if (showSearch) {
      aqlQuery += `
      FILTER CONTAINS(UPPER(doc.show), @showFilter)
      `;
      aqlParameters.showFilter = showSearch.toUpperCase();
    }
    if (creatorSearch) {
      aqlQuery += `
      FILTER CONTAINS(UPPER(doc.creator), @creatorFilter)
      `;
      aqlParameters.creatorFilter = creatorSearch.toUpperCase();
    }
    switch (sortBy) {
      case sortTypesOT.oldest:
        aqlQuery += `
        SORT doc.creation_date DESC
        `;
        break;
      case sortTypesOT.show:
        aqlQuery += `
        SORT doc.show
        `;
        break;
      case sortTypesOT.title:
        aqlQuery += `
        SORT doc.title
        `;
        break;
      case sortTypesOT.creator:
        aqlQuery += `
        SORT doc.creator
        `;
        break;
      default:
        // newest
        aqlQuery += `
        SORT doc.creation_date
        `;
        break;
    }

    aqlQuery += `
    LIMIT @offset, @count
    RETURN UNSET(doc, "comments")`;
    const cursor = await pool.query(aqlQuery, aqlParameters);
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findOpinionThreadsWithFollowedInformation(userId, page, limit, titleSearch, showSearch, creatorSearch, sortBy) {
  try {
    let aqlParameters = {
      from: userId,
      offset: (page - 1) * limit,
      count: limit
    };
    let aqlQuery = `FOR doc IN opinion_threads
    `
    // add filters and sort
    if (titleSearch) {
      aqlQuery += `
      FILTER CONTAINS(UPPER(doc.title), @titleFilter)
      `;
      aqlParameters.titleFilter = titleSearch.toUpperCase();
    }
    if (showSearch) {
      aqlQuery += `
      FILTER CONTAINS(UPPER(doc.show), @showFilter)
      `;
      aqlParameters.showFilter = showSearch.toUpperCase();
    }
    if (creatorSearch) {
      aqlQuery += `
      FILTER CONTAINS(UPPER(doc.creator), @creatorFilter)
      `;
      aqlParameters.creatorFilter = creatorSearch.toUpperCase();
    }
    switch (sortBy) {
      case sortTypesOT.oldest:
        aqlQuery += `
        SORT doc.creation_date DESC
        `;
        break;
      case sortTypesOT.show:
        aqlQuery += `
          SORT doc.show
          `;
        break;
      case sortTypesOT.title:
        aqlQuery += `
          SORT doc.title
          `;
        break;
      case sortTypesOT.creator:
        aqlQuery += `
            SORT doc.creator
            `;
        break;
      default:
        // newest
        aqlQuery += `
        SORT doc.creation_date
        `;
        break;
    }

    aqlQuery += `
    LIMIT @offset, @count
    LET follow = LENGTH(FOR edge IN follows_thread
      FILTER edge._from == @from
      FILTER edge._to == doc._id
      LIMIT 1 RETURN true) > 0
    RETURN { doc: UNSET(doc, "comments"), followed: follow }`;
    const cursor = await pool.query(aqlQuery, aqlParameters);
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findOpinionThreadsByCreator(creator, page, limit, titleSearch, showSearch, sortBy) {
  try {
    const aqlParameters = {
      creator: creator,
      offset: (page - 1) * limit,
      count: limit
    }
    let aqlQuery = `FOR doc IN opinion_threads
    FILTER doc.creator == @creator
    `;
    // add filters and sort
    if (titleSearch) {
      aqlQuery += `
      FILTER CONTAINS(UPPER(doc.title), @titleFilter)
      `;
      aqlParameters.titleFilter = titleSearch.toUpperCase();
    }
    if (showSearch) {
      aqlQuery += `
      FILTER CONTAINS(UPPER(doc.show), @showFilter)
      `;
      aqlParameters.showFilter = showSearch.toUpperCase();
    }
    switch (sortBy) {
      case sortTypesOT.oldest:
        aqlQuery += `
        SORT doc.creation_date DESC
        `;
        break;
      case sortTypesOT.show:
        aqlQuery += `
          SORT doc.show
          `;
        break;
      case sortTypesOT.title:
        aqlQuery += `
          SORT doc.title
          `;
        break;
      case sortTypesOT.creator:
        aqlQuery += `
            SORT doc.creator
            `;
        break;
      default:
        // newest
        aqlQuery += `
        SORT doc.creation_date
        `;
        break;
    }

    aqlQuery += `
    LIMIT @offset, @count
    RETURN UNSET(doc, "comments")`;
    const cursor = await pool.query(aqlQuery, aqlParameters);
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findOpinionThreadsByUserFollowed(userId, page, limit, titleSearch, showSearch, creatorSearch, sortBy) {
  try {
    let aqlParameters = {
      userId: userId,
      offset: (page - 1) * limit,
      count: limit
    };
    let aqlQuery = `FOR vertex IN OUTBOUND
    @userId follows_thread
    `

    // add filters and sort
    if (titleSearch) {
      aqlQuery += `
      FILTER CONTAINS(UPPER(vertex.title), @titleFilter)
      `;
      aqlParameters.titleFilter = titleSearch.toUpperCase();
    }
    if (showSearch) {
      aqlQuery += `
      FILTER CONTAINS(UPPER(vertex.show), @showFilter)
      `;
      aqlParameters.showFilter = showSearch.toUpperCase();
    }
    if (creatorSearch) {
      aqlQuery += `
      FILTER CONTAINS(UPPER(vertex.creator), @creatorFilter)
      `;
      aqlParameters.creatorFilter = creatorSearch.toUpperCase();
    }
    switch (sortBy) {
      case sortTypesOT.oldest:
        aqlQuery += `
        SORT vertex.creation_date DESC
        `;
        break;
      case sortTypesOT.show:
        aqlQuery += `
          SORT vertex.show
          `;
        break;
      case sortTypesOT.title:
        aqlQuery += `
          SORT vertex.title
          `;
        break;
      case sortTypesOT.creator:
        aqlQuery += `
            SORT vertex.creator
            `;
        break;
      default:
        // newest
        aqlQuery += `
        SORT vertex.creation_date
        `;
        break;
    }
    aqlQuery += `
    LIMIT @offset, @count
    RETURN UNSET(vertex, "comments")`;
    const cursor = await pool.query(aqlQuery, aqlParameters);
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findOpinionThreadByKeyWithoutComments(key) {
  try {
    const aqlQuery = `FOR doc IN opinion_threads
    FILTER doc._key == @key
    RETURN UNSET(doc, "comments")`;
    const cursor = await pool.query(aqlQuery, { key: key });
    return (await cursor.all())[0];
  } catch (err) {
    if (err.message == "no match") {
      console.log(`OpinionThread document with _key ${key} not found: `, err.message);
      return null;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function findOpinionThreadByKey(key, page, limit) {
  try {
    const aqlQuery = `FOR doc IN opinion_threads
    FILTER doc._key == @key
    RETURN { 
      _key: doc._key,
      creation_date: doc.creation_date,
      creator: doc.creator,
      description: doc.description,
      show: doc.show,
      show_id: doc.show_id,
      show_type: doc.show_type,
      title: doc.title,
      comments: (
        FOR comment in doc.comments
        SORT comment.creation_date DESC
        LIMIT @offset, @count
        RETURN comment
      )
    }`;
    const cursor = await pool.query(aqlQuery, { key: key, offset: (page - 1) * limit, count: limit });
    return (await cursor.all())[0];
  } catch (err) {
    if (err.message == "no match") {
      console.log(`OpinionThread document with _key ${key} not found: `, err.message);
      return null;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function findOpinionThreadByKeyWithFollowedInformation(userId, key, page, limit) {
  try {
    const aqlQuery = `FOR doc IN opinion_threads
    FILTER doc._key == @key
    LET follow = LENGTH(FOR edge IN follows_thread
      FILTER edge._from == @from
      FILTER edge._to == doc._id
      LIMIT 1 RETURN true) > 0
    RETURN { 
    doc: {
      _key: doc._key,
      creation_date: doc.creation_date,
      creator: doc.creator,
      description: doc.description,
      show: doc.show,
      show_id: doc.show_id,
      show_type: doc.show_type,
      title: doc.title,
      comments: (
        FOR comment in doc.comments
        SORT comment.creation_date DESC
        LIMIT @offset, @count
        RETURN comment
      )
    }, 
    followed: follow }`;
    const cursor = await pool.query(aqlQuery, { from: userId, key: key, offset: (page - 1) * limit, count: limit });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function getOpinionThreadCount(titleSearch, showSearch, creatorSearch) {
  try {
    let aqlParameters = {};
    let aqlQuery = `RETURN LENGTH(
      FOR doc IN opinion_threads
        `;

    // add filters 
    if (titleSearch) {
      aqlQuery += `
      FILTER CONTAINS(UPPER(doc.title), @titleFilter)
      `;
      aqlParameters.titleFilter = titleSearch.toUpperCase();
    }
    if (showSearch) {
      aqlQuery += `
      FILTER CONTAINS(UPPER(doc.show), @showFilter)
      `;
      aqlParameters.showFilter = showSearch.toUpperCase();
    }
    if (creatorSearch) {
      aqlQuery += `
      FILTER CONTAINS(UPPER(doc.creator), @creatorFilter)
      `;
      aqlParameters.creatorFilter = creatorSearch.toUpperCase();
    }

    aqlQuery += `
    RETURN true)`;
    const cursor = await pool.query(aqlQuery, aqlParameters);
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }

}

export async function getOpinionThreadCountByCreator(creator, titleSearch, showSearch) {
  try {
    let aqlParameters = { creator: creator };
    let aqlQuery = `RETURN LENGTH(
      FOR doc IN opinion_threads
        FILTER doc.creator == @creator
        `;

    // add filters 
    if (titleSearch) {
      aqlQuery += `
      FILTER CONTAINS(UPPER(doc.title), @titleFilter)
      `;
      aqlParameters.titleFilter = titleSearch.toUpperCase();
    }
    if (showSearch) {
      aqlQuery += `
      FILTER CONTAINS(UPPER(doc.show), @showFilter)
      `;
      aqlParameters.showFilter = showSearch.toUpperCase();
    }

    aqlQuery += `
    RETURN true)`;
    const cursor = await pool.query(aqlQuery, aqlParameters);
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function getOpinionThreadCountByUserFollowed(userId, titleSearch, showSearch, creatorSearch) {
  try {
    let aqlParameters = { userId: userId };

    let aqlQuery = `RETURN LENGTH(
      FOR vertex IN OUTBOUND
      @userId follows_thread
      `
    // add filters 
    if (titleSearch) {
      aqlQuery += `
      FILTER CONTAINS(UPPER(vertex.title), @titleFilter)
      `;
      aqlParameters.titleFilter = titleSearch.toUpperCase();
    }
    if (showSearch) {
      aqlQuery += `
      FILTER CONTAINS(UPPER(vertex.show), @showFilter)
      `;
      aqlParameters.showFilter = showSearch.toUpperCase();
    }
    if (creatorSearch) {
      aqlQuery += `
      FILTER CONTAINS(UPPER(vertex.creator), @creatorFilter)
      `;
      aqlParameters.creatorFilter = creatorSearch.toUpperCase();
    }

    aqlQuery += `
        RETURN true)`;
    const cursor = await pool.query(aqlQuery, aqlParameters);
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}


export async function insertOpinionThread(opinionThreadDocument) {
  try {
    const cursor = await opinionThreadCollection.save(opinionThreadDocument);
    return cursor._key;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function updateOpinionThread(key, newOpinionThreadAttributes) {
  try {
    const cursor = await opinionThreadCollection.update(key, newOpinionThreadAttributes);
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Error for opinionThread document with _key ${key} during update request: `, err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function deleteOpinionThreadAndEdges(key) {
  try {
    const aqlQuery = `REMOVE {_key: @key } IN opinion_threads
    FOR edge in follows_thread
        FILTER edge._to == @to
        REMOVE edge IN follows_thread 
    RETURN true`;
    const cursor = await pool.query(aqlQuery, { key: key, to: ('opinion_threads/' + key) });
    return true;
  } catch (err) {
    console.log(err.message);
    throw err.message;
  }
}

