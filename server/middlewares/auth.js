import jwt from 'jsonwebtoken';

import { userRoleCode, adminRoleCode } from '../config/UserRoleCodes.js'
import { findUserByRefreshToken, updateUser } from '../db/users_db.js';

export function addJwtCookie(req, response, next) {
  if (req.cookies.Auth) {
    try {
      response.locals.jwt = req.cookies.Auth;
      const payload = jwt.verify(response.locals.jwt, process.env.JWT_SECRET);  
        // check if jwt is valid
      response.locals.payload = payload;
      next();
    } catch (err) {
      let errorMessage = 'invalid_jwt';
      response.status(401);
      if(err.name === 'TokenExpiredError') {
        console.log('Request with expired token');
        errorMessage = 'expired_jwt';
      }
      response.clearCookie('Auth', {
        httpOnly: true, sameSite: 'None',
        secure: true
      });
      findUserByRefreshToken(req.cookies.Auth)
      .then((user) => {
        if (user !== null ) {
          // delete refresh token in db if user is found
          updateUser(user._key, { refreshToken: null });
        }
      })
      response.json({ error: errorMessage });
    }
  } else {
    next();
  }
}

export function authorize(roles = [userRoleCode, adminRoleCode]) {
  return (_req, response, next) => {
    if (!response.locals.jwt) {
      response.status(401).end();
    } else if (!roles.includes(response.locals.payload.role)) {
      // not appropriate role
      response.status(403).end();
    } else {
      // role ok
      next();
    }
  };
}
