import { moderatorRoleCode } from '../config/UserRoleCodes.js';
import getPool from './connection_db.js';

let moderatorRequestsCollection;

async function initializeCollection() {
  const pool = await getPool();
  moderatorRequestsCollection = pool.collection("moderator_requests");
}

initializeCollection();

const employmentFileType = 'moderatorEmployementStatus';
const reqFileType = 'moderatorRequest';


function addFilters(aqlQuery, aqlParameters, name, docName = 'doc') {
  if (name) {
    aqlQuery += `
    FILTER CONTAINS(UPPER(${docName}.username), @usernameFilter)
    `;
    aqlParameters.usernameFilter = name.toUpperCase();
  }

  return aqlQuery;
}


// moderator employement file type

export async function insertEmploymentFile() {
  try {
    if (!moderatorRequestsCollection) {
      await initializeCollection();
    }
    const cursor = await moderatorRequestsCollection.save({
      type: employmentFileType,
      employementIsOpen: false
    });
    return cursor._key;
  } catch (err) {
    throw err.message;
  }
}

export async function checkEmploymentFileExists() {
  try {
    const aqlQuery = `RETURN LENGTH(FOR doc IN moderator_requests
      FILTER doc.type == @type LIMIT 1 RETURN true) > 0`;
    const pool = await getPool();
    const cursor = await pool.query(aqlQuery, { type: employmentFileType });
    return (await cursor.all())[0];
  } catch (err) {
    throw err.message;
  }
}

export async function getEmploymentIsOpen() {
  try {
    const aqlQuery = `FOR doc IN moderator_requests
      FILTER doc.type == @type
      RETURN doc.employementIsOpen`;
    const pool = await getPool();
    const cursor = await pool.query(aqlQuery, { type: employmentFileType });
    return (await cursor.all())[0];
  } catch (err) {
    throw err.message;
  }

}


// moderator request file types

export async function findModeratorRequests(page, limit, name) {
  try {
    let aqlParameters = {
      offset: (page - 1) * limit,
      count: limit,
      type: reqFileType
    }
    let aqlQuery = `FOR doc IN moderator_requests
    FILTER doc.type == @type
    `
    aqlQuery = addFilters(aqlQuery, aqlParameters, name);

    aqlQuery += `
    FOR user in users
      FILTER user._key == doc.creator_key
    SORT doc.create_date
    LIMIT @offset, @count
    RETURN MERGE(doc, { register_date: user.create_date, about_user: user.about_me})`;
    const pool = await getPool();
    const cursor = await pool.query(aqlQuery, aqlParameters);
    return await cursor.all();
  } catch (err) {
    throw err.message;
  }
}

export async function getModeratorRequestsCount(name) {
  try {
    let aqlParameters = { type: reqFileType }
    let aqlQuery = `RETURN LENGTH(FOR doc IN moderator_requests
      FILTER doc.type == @type
    `
    aqlQuery = addFilters(aqlQuery, aqlParameters, name);

    aqlQuery += `
      RETURN true)`;
    const pool = await getPool();
    const cursor = await pool.query(aqlQuery, aqlParameters);
    return (await cursor.all())[0];
  } catch (err) {
    throw err.message;
  }
}


export async function insertModeratorRequest(modRequestJson) {
  try {
    modRequestJson.type = reqFileType;
    if (!moderatorRequestsCollection) {
      await initializeCollection();
    }
    const cursor = await moderatorRequestsCollection.save(modRequestJson);
    return cursor._key;
  } catch (err) {
    throw err.message;
  }
}

export async function deleteModeratorRequest(key) {
  try {
    if (!moderatorRequestsCollection) {
      await initializeCollection();
    }
    await moderatorRequestsCollection.remove({ _key: key });
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Warning for moderator request document with _key ${key} during delete request: `, err.message);
      return false;
    } else {
      throw err.message;
    }

  }
}

export async function handleHiringStatusChangeTransaction() {
  try {
    const pool = await getPool();
    const transaction = await pool.beginTransaction({
      write: ["moderator_requests"],
      allowImplicit: false
    });

    // update the status
    await transaction.step(async () => {
      const aqlQuery = `FOR doc IN moderator_requests
      FILTER doc.type == @type
      UPDATE doc._key WITH { employementIsOpen: (! doc.employementIsOpen) } in moderator_requests`;
      const pool = await getPool();
      await pool.query(aqlQuery, { type: employmentFileType });
    });

    // delete requests
    await transaction.step(async () => {
      const aqlQuery = `FOR doc IN moderator_requests
      FILTER doc.type == @type
      REMOVE doc in moderator_requests`;
      const pool = await getPool();
      await pool.query(aqlQuery, { type: reqFileType });
    });

    const transactionResult = await transaction.commit();
    console.log('Transaction for changing moderator hiring status: ', transactionResult.status);
    return true;

  } catch (err) {
    throw err.message;
  }
}

export async function handleRequestAcceptTransaction(key) {
  try {
    const pool = await getPool();
    const transaction = await pool.beginTransaction({
      write: ["moderator_requests", "users"],
      allowImplicit: false
    });


    const moderatorRequest = await transaction.step(async () => {
      if (!moderatorRequestsCollection) {
        await initializeCollection();
      }
      const cursor = await moderatorRequestsCollection.firstExample({ _key: key });
      return cursor;
    });

    const usersCollection = pool.collection("users");

    if (moderatorRequest) {
      const user = await transaction.step(async () => {
        const cursor = await usersCollection.firstExample({ _key: moderatorRequest.creator_key });
        return cursor;
      });

      if (!user) {
        const transactionResult = await transaction.abort();
        console.log('Transaction for accepting moderator request: ', transactionResult.status, '. No user');
        return {
          error: true,
          errorMessage: '404_user'
        }
      }

      // update user role
      await transaction.step(async () => {
        await usersCollection.update(moderatorRequest.creator_key, { role: moderatorRoleCode });
      });

      // delete request
      await transaction.step(async () => {
        const aqlQuery = `FOR doc IN moderator_requests
        FILTER doc._key == @key
        REMOVE doc in moderator_requests`;
        const pool = await getPool();
        await pool.query(aqlQuery, { key: key });
      });

      const transactionResult = await transaction.commit();
      console.log('Transaction for accepting moderator request: ', transactionResult.status);
      return {
        error: false
      }
    } else {
      // request not found
      const transactionResult = await transaction.abort();
      console.log('Transaction for accepting moderator request: ', transactionResult.status, '. No request');
      return {
        error: true,
        errorMessage: '404'
      }
    }


  } catch (err) {
    throw err.message;
  }
}