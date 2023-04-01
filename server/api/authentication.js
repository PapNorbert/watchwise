import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


import { checkRegistrationInformation, checkLoginInformation } from '../util/authValidation.js'
import { insertUser, findUserByUsername } from '../db/users_db.js'
import { userRoleCode } from '../config/UserRoleCodes.js'


const router = express.Router();


router.post('/register', async (req, response) => {
  response.set('Content-Type', 'application/json');
  response.status(201);
  try {
    const userInformation = req.body;
    const correctData = await checkRegistrationInformation(userInformation);
    // check required fields not empty, passwords correct format, username is available
    if( !correctData.correct ) {
      console.log('Bad registration information')
      response.status(400).json({ error: `Bad registration information: ${correctData.error}` });
    } else { // correct information
      const userDataToInsert = {
        first_name: userInformation.first_name,
        last_name: userInformation.last_name,
        username: userInformation.username,
        create_date: new Date(Date.now()),
        role: userRoleCode,
      }
      userDataToInsert['password'] = await bcrypt.hash(userInformation.passwd, 10);
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
  response.status(204);
  try {
    const userInformation = req.body;
    const correct = await checkLoginInformation(userInformation);
        // check username and passwd not empty
    if (!correct) {
      console.log('Bad login information')
      response.status(400).json({ error: 'login_empty_field_error'});
    } else {
      const user = await findUserByUsername(userInformation.username);
      if (user === null ) {
        response.status(400).json({ error: 'login_incorrect' });
      } else {  // user exists
        const correct = await bcrypt.compare(userInformation.passwd, user.password);
        if( correct ) {
          const cookie = jwt.sign(
            {
              username: user.username,
              type: userRoleCode,
            },
            process.env.JWT_SECRET,
          );
          response.cookie('Auth', cookie, { httpOnly: true, sameSite: 'None', 
            secure: true, maxAge: 24*60*60*1000 });
            // maxAge: 1 day in milliseconds
            response.end();
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

export default router;
