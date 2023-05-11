import pool from './connection_db.js'
import { userRoleCode, adminRoleCode } from '../config/userRoleCodes.js'

const usersCollection = pool.collection("users");



export async function findUsers(page, limit) {
  try {
    const aqlQuery = `FOR doc IN users
    FILTER doc.role == @userRole
    SORT doc.username
    LIMIT @offset, @count
    RETURN { 
      _key: doc._key,
      first_name: doc.first_name, 
      last_name: doc.last_name, 
      username: doc.username, 
      create_date: doc.create_date,
      about_me: doc.about_me,
      banned: doc.banned
    }`;
    const cursor = await pool.query(aqlQuery, { offset: (page - 1) * limit, count: limit, userRole: userRoleCode });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findUsersByUsernameContains(page, limit, name) {
  try {
    const aqlQuery = `FOR doc IN users
    FILTER doc.role == @userRole
    FILTER CONTAINS(UPPER(doc.username), @nameFilter)
    LIMIT @offset, @count
    RETURN { 
      _key: doc._key,
      first_name: doc.first_name, 
      last_name: doc.last_name, 
      username: doc.username, 
      create_date: doc.create_date,
      about_me: doc.about_me,
      banned: doc.banned
    }`;
    const cursor = await pool.query(aqlQuery, {
      offset: (page - 1) * limit, count: limit, userRole: userRoleCode, nameFilter: name
    });
    return await cursor.all();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function findUserByKey(key) {
  try {
    const cursor = await usersCollection.firstExample({ _key: key });
    return cursor;
  } catch (err) {
    if (err.message == "no match") {
      console.log(`User document with _key ${key} not found: `, err.message);
      return null;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function findUserByUsername(username) {
  try {
    const cursor = await usersCollection.firstExample({ username: username });
    return cursor;
  } catch (err) {
    if (err.message == "no match") {
      console.log(`User document with username ${username} not found: `, err.message);
      return null;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function findUserByRefreshToken(refreshToken) {
  try {
    const cursor = await usersCollection.firstExample({ refreshToken: refreshToken });
    return cursor;
  } catch (err) {
    if (err.message == "no match") {
      console.log(`User document with refreshToken ${refreshToken} not found: `, err.message);
      return null;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function getUsersCount() {
  try {
    const aqlQuery = `RETURN LENGTH(FOR doc IN users
      FILTER doc.role == @userRole
      RETURN true)`;
    const cursor = await pool.query(aqlQuery, { userRole: userRoleCode });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }

}

export async function getUsersCountByUsernameContains(name) {
  try {
    const aqlQuery = `RETURN LENGTH(FOR doc IN users
      FILTER doc.role == @userRole
      FILTER CONTAINS(UPPER(doc.username), @nameFilter)
      RETURN true)`;
    const cursor = await pool.query(aqlQuery, { userRole: userRoleCode, nameFilter: name });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }

}

export async function checkUserExistsWithUsername(username) {
  try {
    const aqlQuery = `RETURN LENGTH(FOR doc IN users
      FILTER doc.username == @username LIMIT 1 RETURN true) > 0`;
    const cursor = await pool.query(aqlQuery, { username: username });
    return (await cursor.all())[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}


export async function insertUser(user) {
  try {
    const cursor = await usersCollection.save(user);
    return cursor._key;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function updateUser(key, newUserAttributes) {
  try {
    const cursor = await usersCollection.update(key, newUserAttributes);
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Error for user document with _key ${key} during update request: `, err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function deleteUser(key) {
  try {
    const cursor = await usersCollection.remove({ _key: key });
    return true;
  } catch (err) {
    if (err.message == "document not found") {
      console.log(`Warning for user document with _key ${key} during delete request: `, err.message);
      return false;
    } else {
      console.log(err);
      throw err;
    }

  }
}

export async function handleUserBanTransaction(userKey) {
  // when banning user delete also the his join requests, and remove him from the joined groups
  try {
    const transaction = await pool.beginTransaction({
      write: ["join_request", "joined_group", "watch_groups", "users"],
      allowImplicit: false
    });

    const user = await transaction.step(async () => {
      return await usersCollection.firstExample({ _key: userKey });
    });

    if( !user ) {
      const transactionResult = await transaction.abort();
      console.log('Transaction for user ban: ', transactionResult.status, '. No user found');
      return {
        error: true,
        errorMessage: '404'
      }
    }
    if( user.role === adminRoleCode) {
      const transactionResult = await transaction.abort();
      console.log('Transaction for user ban: ', transactionResult.status, '. Attempt to ban an admin user');
      return {
        error: true,
        errorMessage: 'error_admin_ban'
      }
    }
    let actionPerformed = 'ban'
    if (user.banned) {
      actionPerformed = 'unban'
    }
    const updatedUserStatus = await transaction.step(async () => {
      await usersCollection.update(user._key, { banned: (!user.banned) });
      return true;
    });
    if (!updatedUserStatus) {
      const transactionResult = await transaction.abort();
      console.log('Transaction for user ban: ', transactionResult.status, '. Error updating user status');
      return {
        error: true,
        errorMessage: 'error_ban_status_update'
      }
    }
    if( actionPerformed === 'ban' ) {
      // delete edges for user
      const deletedRequests = await transaction.step(async () => {
        const aqlQuery = `FOR doc IN join_request
          FILTER doc._from == @from
          REMOVE { _key: doc._key } IN join_request`;
        await pool.query(aqlQuery, { from: user._id });
        return true;
      });
      if (!deletedRequests) {
        const transactionResult = await transaction.abort();
        console.log('Transaction for user ban: ', transactionResult.status, '. Error deleteing join requests');
        return {
          error: true,
          errorMessage: 'error_ban_status_update'
        }
      }

      const deletedGroupJoins = await transaction.step(async () => {
        const aqlQuery = `FOR doc IN joined_group
          FILTER doc._from == @from
          FOR group IN watch_groups 
            FILTER group._id == doc._to
            UPDATE group._key WITH { currentNrOfPersons: (group.currentNrOfPersons - 1) } in watch_groups
          REMOVE { _key: doc._key } IN joined_group
          `;
        await pool.query(aqlQuery, { from: user._id });
        return true;
      });
      if (!deletedGroupJoins) {
        const transactionResult = await transaction.abort();
        console.log('Transaction for user ban: ', transactionResult.status, '. Error deleteing join requests');
        return {
          error: true,
          errorMessage: 'error_ban_status_update'
        }
      }
    }

    const transactionResult = await transaction.commit();
    console.log('Transaction for user ban: ', transactionResult.status, '. Status change performed');
    return {
      error: false,
      actionPerformed: actionPerformed
    }

  } catch (err) {
    console.log(err.message);
    throw err.message;
  }
}