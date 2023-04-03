import jwt_decode from 'jwt-decode'

export default function decodeJwtAccesToken(accesToken) {
  // returns auth information
  let authFromJwt = {}
  let correct = false;
  if (accesToken) {
    authFromJwt = jwt_decode(accesToken);
    if (authFromJwt.userID && authFromJwt.username && authFromJwt.role) {
      correct = true;
    }
  }
  authFromJwt['logged_in'] = correct;
  return authFromJwt;
}