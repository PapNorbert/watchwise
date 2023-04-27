import pool from './connection_db.js'
import { userRoleCode } from '../config/userRoleCodes.js'

const usersCollection = pool.collection("users");



export async function findUsers(page, limit) {
  try {
    const aqlQuery = `FOR doc IN users
    FILTER doc.role == @userRole
    LIMIT @offset, @count
    RETURN { 
      _key: doc._key,
      first_name: doc.first_name, 
      last_name: doc.last_name, 
      username: doc.username, 
      create_date: doc.create_date
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
      create_date: doc.create_date
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