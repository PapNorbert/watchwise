import express from 'express';

import { deleteUser, findUserByKey, updateUser } from '../db/users_db.js'
import { createResponseDto } from '../dto/outgoing_dto.js'
import { adminRoleCode } from '../config/UserRoleCodes.js'
import { authorize} from '../middlewares/auth.js'

const router = express.Router();


router.get('/:id', authorize([adminRoleCode]), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  if (parseInt(request.params.id) == request.params.id) { // correct parameter
    const id = request.params.id;
    try {
      const user = await findUserByKey(id);
      if (user != null) {
        response.json(createResponseDto(user));
      } else { // no entity found with id
        response.status(404).end();
      }
      
    } catch (err) { 
      console.log(err);
      response.status(400);
      response.json({
        error: err.message
      }); 
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({error: 'bad_req_par_number'});
  }

});

router.put('/:id', authorize([adminRoleCode]), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.id) == request.params.id) { // correct parameter
    const id = request.params.id;
    try {
      const newUserAttributes = request.body;
      const succesfull = await updateUser(id, newUserAttributes);
      if (!succesfull) {
        response.status(404);
      }
      response.end();

    } catch (err) {
      console.log(err);
      response.status(400);
      response.json({
        error: 'error'
      }); 
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({error: 'bad_req_par_number'});
  }

});

router.delete('/:id', authorize([adminRoleCode]), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.id) == request.params.id) { // correct parameter
    const id = request.params.id;
    try {
      const succesfull = await deleteUser(id);
      if (!succesfull) {
        response.status(404);
      }
      response.end();
      
    } catch (err) { 
      console.log(err);
      response.status(400);
      response.json({
        error: err.message
      }); 
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({error: 'bad_req_par_number'});
  }

});


export default router;
