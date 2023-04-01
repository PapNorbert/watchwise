import jwt from 'jsonwebtoken';

import { userRoleCode, adminRoleCode } from '../config/UserRoleCodes.js'

export function addJwtCookie(req, response, next) {
  if (req.cookies.Auth) {
    try {
      response.locals.jwt = req.cookies.Auth;
      const payload = jwt.verify(response.locals.jwt, process.env.JWT_SECRET);  
        // check if jwt is valid
      response.locals.payload = payload;
      next();
    } catch (err) {
      response.clearCookie('Auth');
      response.status(401).json({ error: 'invalid_jwt' });
    }
  } else {
    next();
  }
}

export function authorize(roles = [userRoleCode, adminRoleCode]) {
  return (_req, response, next) => {
    if (!response.locals.jwt) {
      response.set('Content-Type', 'application/json').status(401);
      response.json({ error: 'permission_error_unauth' });
    } else if (!roles.includes(response.locals.payload.type)) {
      // not appropriate role
      response.set('Content-Type', 'application/json').status(403);
      response.json({ error: 'permission_error_forbidden' });
    } else {
      // role ok
      next();
    }
  };
}
