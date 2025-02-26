import createPool from 'arangojs';
import { 
  dbPasswd, dbUsername, dbName, poolUrl, poolMax, 
  poolMin, poolIdleTimeoutMillis, poolConnectionTimeoutMillis
} from '../config/dbSecret.js';

let pool;

export async function createDatabaseIfNotExists() {
  try {
    const temporaryDb = new createPool({
      url: poolUrl,
      auth: { username: dbUsername, password: dbPasswd },
    });
    const databases = await temporaryDb.listDatabases();
    if (!databases.includes(dbName)) {
      await temporaryDb.createDatabase(dbName);
      console.log(`Database ${dbName} created successfully.`);
    } else {
      console.log(`Database ${dbName} already exists.`);
    }
  } catch (err) {
    console.error('Error creating database:', err);
  }
}

async function initializePool() {
  try {
    pool = new createPool({
      url: poolUrl,
      databaseName: dbName,
      auth: { username: dbUsername, password: dbPasswd },
      max: poolMax, 
      min: poolMin, 
      idleTimeoutMillis: poolIdleTimeoutMillis, 
      connectionTimeoutMillis: poolConnectionTimeoutMillis, 
    });
    console.log(`Pool connected to database ${dbName}`);
  } catch (err) {
    console.error('Error initializing the pool:', err);
  }
}

async function getPool() {
  if (!pool) {
    await initializePool();
  }
  return pool;
}

export default getPool;
