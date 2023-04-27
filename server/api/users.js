import express from 'express';

import {
  findUsersByUsernameContains, findUsers,
  getUsersCountByUsernameContains, getUsersCount,
  deleteUser, findUserByKey, updateUser
} from '../db/users_db.js'
import { createResponseDto, createResponseDtos } from '../dto/outgoing_dto.js'
import { createPaginationInfo } from '../util/util.js'
import { authorize } from '../middlewares/auth.js'
import { adminRoleCode } from '../config/UserRoleCodes.js'


const router = express.Router();


router.get('', authorize([adminRoleCode]), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  try {
    let { page = 1, limit = 10, name } = request.query;
    if (parseInt(page) == page && parseInt(limit) == limit
      && parseInt(page) > 0 && parseInt(limit) > 0) { // correct paging information
      page = parseInt(page);
      limit = parseInt(limit);
      if (name) {
        // get users filtered by name
        const [users, count] = await Promise.all([
          findUsersByUsernameContains(page, limit, name.toUpperCase()),
          getUsersCountByUsernameContains(name.toUpperCase()),
        ]);
        response.json({
          "data": createResponseDtos(users),
          "pagination": createPaginationInfo(page, limit, count)
        });
      } else {
        // get all users
        const [users, count] = await Promise.all([
          findUsers(page, limit),
          getUsersCount(),
        ]);
        response.json({
          "data": createResponseDtos(users),
          "pagination": createPaginationInfo(page, limit, count)
        });
      }

    } else {
      response.status(400).json({ error: "bad_paging" })
    }
  } catch (err) {
    console.log(err.message);
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
    const id = request.params.user_id;
    try {
      const user = await findUserByKey(id);
      if (user !== null ) {
        if( user.role === adminRoleCode) {
          console.log('Attempt to ban an admin user')
          response.status(400).json({
            error: 'error_admin_ban'
          });
        }
        if (user.banned) {
          response.status(202);
        }
        const updated = await updateUser(user._id, { banned: !user.banned });
        if (!updated) {
          response.status(404);
        }
        response.end();
      } else { // user not found
        response.status(404).end();
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

// router.put('/:id', authorize([adminRoleCode]), async (request, response) => {
//   response.set('Content-Type', 'application/json');
//   response.status(204);
//   if (parseInt(request.params.id) == request.params.id
//     && parseInt(request.params.id) > 0) { // correct parameter
//     const id = request.params.id;
//     try {
//       const newUserAttributes = request.body;
//       const succesfull = await updateUser(id, newUserAttributes);
//       if (!succesfull) {
//         response.status(404);
//       }
//       response.end();

//     } catch (err) {
//       console.log(err);
//       response.status(400);
//       response.json({
//         error: 'error'
//       });
//     }
//   } else { // incorrect parameter
//     response.status(400);
//     response.json({ error: 'bad_req_par_number' });
//   }

// });

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
