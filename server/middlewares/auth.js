import jwt from 'jsonwebtoken';

import { userRoleCode, adminRoleCode, moderatorRoleCode } from '../config/UserRoleCodes.js'
import { findUserByRefreshToken, updateUser } from '../db/users_db.js';

export function addJwtCookie(req, response, next) {
  if (req.cookies.Auth) {
    try {
      response.locals.jwt = req.cookies.Auth;
      const payload = jwt.verify(response.locals.jwt, process.env.JWT_SECRET);
      response.locals.payload = payload;
      // check if jwt is valid
      findUserByRefreshToken(req.cookies.Auth)
        .then((user) => {
          if (user === null || user.username !== response.locals.payload.username) {
            // the user doesn't match with the user from the jwt
            response.clearCookie('Auth', {
              httpOnly: true, sameSite: 'None',
              secure: true
            });
            response.sendStatus(403);
          } else {
            const correct = true;
            if (req.body.creator !== undefined && req.body.creator !== user.username) {
              correct = false;
            }
            if (req.body.user !== undefined && req.body.user !== user.username) {
              correct = false;
            }
            if (correct) {
              next();
            } else {
              response.clearCookie('Auth', {
                httpOnly: true, sameSite: 'None',
                secure: true
              });
              response.sendStatus(403);
            }
          }
        })
    } catch (err) {
      let errorMessage = 'invalid_jwt';
      response.status(401);
      if (err.name === 'TokenExpiredError') {
        console.log('Request with expired token');
        errorMessage = 'expired_jwt';
      }
      response.clearCookie('Auth', {
        httpOnly: true, sameSite: 'None',
        secure: true
      });
      findUserByRefreshToken(req.cookies.Auth)
        .then((user) => {
          if (user !== null) {
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

export function authorize(roles = [userRoleCode, adminRoleCode, moderatorRoleCode]) {
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
