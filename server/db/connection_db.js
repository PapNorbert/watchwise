import createPool from 'arangojs'

import { 
  dbPasswd, dbUsername, dbName, poolUrl, poolMax, 
  poolMin, poolIdleTimeoutMillis, poolConnectionTimeoutMillis
} from '../config/dbSecret.js'

let pool;

try {
   pool = await createPool({
    url: poolUrl,
    databaseName: dbName,
    auth: { username: dbUsername, password: dbPasswd },
    max: poolMax, 
    min: poolMin, 
    idleTimeoutMillis: poolIdleTimeoutMillis, 
    connectionTimeoutMillis: poolConnectionTimeoutMillis, 
  });
} catch(err) {
  console.log(err);
}

export default pool;