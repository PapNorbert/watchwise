import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


import { checkRegistrationInformation, checkLoginInformation } from '../util/authValidation.js'
import { insertUser, findUserByUsername, updateUser, findUserByRefreshToken } from '../db/users_db.js'
import { userRoleCode } from '../config/UserRoleCodes.js'


const router = express.Router();


router.post('/register', async (req, response) => {
  response.set('Content-Type', 'application/json');
  response.status(201);
  try {
    const userInformation = req.body;
    const correctData = await checkRegistrationInformation(userInformation);
    // check required fields not empty, passwords correct format, username is available
    if (!correctData.correct) {
      console.log('Bad registration information')
      response.status(400).json({ error: correctData.error });
    } else { // correct information
      const userDataToInsert = {
        first_name: userInformation.first_name,
        last_name: userInformation.last_name,
        username: userInformation.username,
        create_date: new Date(Date.now()),
        role: userRoleCode,
      }
      userDataToInsert['password'] = await bcrypt.hash(userInformation.passwd, 10);
      userDataToInsert['refreshToken'] = null;
      await insertUser(userDataToInsert);
      response.end();
    }

  } catch (err) {
    console.log(err);
    response.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  try {
    const userInformation = req.body;
    const correct = await checkLoginInformation(userInformation);
    // check username and passwd not empty
    if (!correct) {
      console.log('Bad login information')
      response.status(400).json({ error: 'login_empty_field_error' });
    } else {
      const user = await findUserByUsername(userInformation.username);
      if (user === null) {
        response.status(400).json({ error: 'login_incorrect' });
      } else {  // user exists
        const correct = await bcrypt.compare(userInformation.passwd, user.password);
        if (correct) {
          const accesToken = jwt.sign(
            {
              userID: user._key,
              username: user.username,
              role: userRoleCode,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
          );
          const refreshToken = jwt.sign(
            {
              userID: user._key,
              username: user.username,
              role: userRoleCode,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
          );
          const saved = await updateUser(user._key, { refreshToken: refreshToken });
          if (saved) {
            response.cookie('Auth', refreshToken, {
              httpOnly: true, sameSite: 'None',
              secure: true, maxAge: 60 * 60 * 1000
            });
            // maxAge: 1 hour in milliseconds
            response.json({ accesToken });
            // cookie contains the longer refresh token, and for react we send the short acces token
          } else {
            response.status(400).json({ error: 'db_update_error' });
          }

        } else {  // wrong password
          response.status(400).json({ error: 'login_incorrect' });
        }
      }
    }

  } catch (err) {
    console.log(err);
    response.status(400).json({ error: err.message });
  }
});

router.get('/refresh', async (req, response) => {
  const cookies = req.cookies;
  if (!cookies?.Auth) {
    response.sendStatus(204);
  } else {  // there is a cookie
    try {
      const user = await findUserByRefreshToken(cookies.Auth);
      if (user === null || user.username !== response.locals.payload.username) {
        // the user doesn't match with the user from the jwt
        response.sendStatus(403);
      } else {
        // ok
        const accesToken = jwt.sign(
          {
            userID: user._key,
            username: user.username,
            role: userRoleCode,
          },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        response.set('Content-Type', 'application/json');
        response.status(200).json({ accesToken });
      }
    } catch (err) {
      console.log(err.message);
      response.sendStatus(400);
    }
  }
});

router.use('/logout', async (req, response) => {
  const cookies = req.cookies;
  if (!cookies?.Auth) {
    response.sendStatus(204); // no content 
  } else {  // there is a cookie
    try {
      const user = await findUserByRefreshToken(cookies.Auth);
      if (user !== null ) {
        // delete refresh token in db if user is found
        const succesfull = await updateUser(user._key, { refreshToken: null });
        if (!succesfull) {
          response.status(400).json({ error: 'db_update_error' });
        }
      }
      response.clearCookie('Auth', {
        httpOnly: true, sameSite: 'None',
        secure: true
      });
      response.sendStatus(204);
    } catch (err) {
      console.log(err.message);
      response.sendStatus(400);
    }
  }
});


export default router;