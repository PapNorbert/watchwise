export const dbPasswd = process.env.DB_PASSWD;
export const dbUsername = process.env.DB_USERNAME;
export const dbName = process.env.DB_NAME;
export const poolUrl = process.env.POOL_URL;
export const poolMax = parseInt(process.env.POOL_MAX, 10);
export const poolMin = parseInt(process.env.POOL_MIN, 10);
export const poolIdleTimeoutMillis = parseInt(process.env.POOL_IDLE_TIMEOUT_MILLIS, 10);
export const poolConnectionTimeoutMillis = parseInt(process.env.POOL_CONNECTION_TIMEOUT_MILLIS, 10);