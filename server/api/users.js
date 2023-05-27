import express from 'express';

import {
  findUsers, getUsersCount, updateUser,
  handleUserBanTransaction
} from '../db/users_db.js'
import { createResponseDto, createResponseDtos } from '../dto/outgoing_dto.js'
import { createPaginationInfo } from '../util/paginationInfo.js'
import { authorize } from '../middlewares/auth.js'
import { adminRoleCode, moderatorRoleCode, userRoleCode } from '../config/UserRoleCodes.js'


const router = express.Router();


router.get('', authorize([adminRoleCode]), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  try {
    let { page = 1, limit = 5, name, moderatorsOnly, banType = 'all' } = request.query;
    if (parseInt(page) == page && parseInt(limit) == limit
      && parseInt(page) > 0 && parseInt(limit) > 0) { // correct paging information
      page = parseInt(page);
      limit = parseInt(limit);

      const [users, count] = await Promise.all([
        findUsers(page, limit, name, moderatorsOnly, banType),
        getUsersCount(name, moderatorsOnly, banType),
      ]);
      response.json({
        "data": createResponseDtos(users),
        "pagination": createPaginationInfo(page, limit, count)
      });


    } else {
      response.status(400).json({ error: "bad_paging" })
    }
  } catch (err) {
    console.log(err);
    response.status(400).json({
      error: "error"
    });
  }

});

router.post('/:user_id/ban', authorize([adminRoleCode]), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.user_id) == request.params.user_id
    && parseInt(request.params.user_id) > 0) { // correct parameter
    try {
      const transactionRespn = await handleUserBanTransaction(request.params.user_id);
      if (transactionRespn.error) {
        if (transactionRespn.errorMessage === '404') {
          response.status(404).end();
        } else {
          response.status(400).json({ error: transactionRespn.errorMessage });
        }
      } else {
        //transaction completed succesfully
        if (transactionRespn.actionPerformed === 'ban') {
          response.end();
        } else {
          response.sendStatus(202);
        }
      }

    } catch (err) {
      console.log(err);
      response.status(400).json({
        error: err.message
      });
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({ error: 'bad_req_par_number' });
  }

});

// router.get('/:id', authorize([adminRoleCode]), async (request, response) => {
//   response.set('Content-Type', 'application/json');
//   response.status(200);
//   if (parseInt(request.params.id) == request.params.id
//     && parseInt(request.params.id) > 0) { // correct parameter
//     const id = request.params.id;
//     try {
//       const user = await findUserByKey(id);
//       if (user != null) {
//         response.json(createResponseDto(user));
//       } else { // no entity found with id
//         response.status(404).end();
//       }

//     } catch (err) {
//       console.log(err);
//       response.status(400);
//       response.json({
//         error: err.message
//       });
//     }
//   } else { // incorrect parameter
//     response.status(400);
//     response.json({ error: 'bad_req_par_number' });
//   }

// });


router.put('/:id', authorize([adminRoleCode]), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.id) == request.params.id
    && parseInt(request.params.id) > 0) { // correct parameter
    const id = request.params.id;
    try {
      const newUserAttributes = request.body;
      console.log(newUserAttributes)
      if (newUserAttributes.role && newUserAttributes.role === userRoleCode) {
        // revoking priviliges, setting role to user
        const succesfull = await updateUser(id, { role: userRoleCode });
        if (!succesfull) {
          response.status(404);
        }
        response.end();
      } else {
        response.status(400).json({
          error: 'unsupported_update'
        });
      }

    } catch (err) {
      console.log(err);
      response.status(400).json({
        error: 'error'
      });
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({ error: 'bad_req_par_number' });
  }

});

// router.delete('/:id', authorize([adminRoleCode]), async (request, response) => {
//   response.set('Content-Type', 'application/json');
//   response.status(204);
//   if (parseInt(request.params.id) == request.params.id
//     && parseInt(request.params.id) > 0) { // correct parameter
//     const id = request.params.id;
//     try {
//       const succesfull = await deleteUser(id);
//       if (!succesfull) {
//         response.status(404);
//       }
//       response.end();

//     } catch (err) {
//       console.log(err);
//       response.status(400);
//       response.json({
//         error: err.message
//       });
//     }
//   } else { // incorrect parameter
//     response.status(400);
//     response.json({ error: 'bad_req_par_number' });
//   }

// });


export default router;
