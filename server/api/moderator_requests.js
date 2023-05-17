import express from 'express';

import {
  getEmploymentIsOpen, findModeratorRequests, getModeratorRequestsCount,
  handleHiringStatusChangeTransaction, handleRequestAcceptTransaction,
  insertModeratorRequest, deleteModeratorRequest
} from '../db/moderator_req_db.js'
import { authorize } from '../middlewares/auth.js'
import { adminRoleCode, moderatorRoleCode } from '../config/UserRoleCodes.js'
import { createResponseDtos } from '../dto/outgoing_dto.js'
import { createPaginationInfo } from '../util/paginationInfo.js'
import { validateModRequestCreation } from '../util/moderatorRequestValidation.js'

const router = express.Router();


router.get('', authorize([adminRoleCode]), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  try {
    let { page = 1, limit = 5, name } = request.query;
    if (parseInt(page) == page && parseInt(limit) == limit
      && parseInt(page) > 0 && parseInt(limit) > 0) { // correct paging information
      page = parseInt(page);
      limit = parseInt(limit);

      const hiringIsOpen = await getEmploymentIsOpen();
      if (hiringIsOpen) {
        const [moderatorRequests, count] = await Promise.all([
          findModeratorRequests(page, limit, name),
          getModeratorRequestsCount(name),
        ]);
        response.json({
          "hiringIsOpen": hiringIsOpen,
          "data": createResponseDtos(moderatorRequests),
          "pagination": createPaginationInfo(page, limit, count)
        });
      } else {
        response.json({ "hiringIsOpen": hiringIsOpen });
      }


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

router.get('/isOpen', async (_request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  try {
    const hiringIsOpen = await getEmploymentIsOpen();
    response.json(hiringIsOpen);
  } catch (err) {
    console.log(err);
    response.status(400).json({
      error: "error"
    });
  }

});

router.post('', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  try {
    let modRequestJson = request.body;
    const { correct, error } = await validateModRequestCreation(modRequestJson);
    if (correct) {
      modRequestJson.creation_date = new Date(Date.now());
      const id = await insertModeratorRequest(modRequestJson);
      response.status(201).json({ id: id });
    } else {
      response.status(400).json({
        error: error
      });
    }

  } catch (err) {
    console.log(err);
    response.status(400);
    response.json({
      error: "error"
    });
  }

});

router.post('/:id', authorize([adminRoleCode]), async (request, response) => {
  // make user moderator
  response.set('Content-Type', 'application/json');
  response.status(200);
  if (parseInt(request.params.id) == request.params.id
    && parseInt(request.params.id) > 0) { // correct parameter
    try {
      const transactionRespn = await handleRequestAcceptTransaction(request.params.id);
      if (transactionRespn.error) {
        if (transactionRespn.errorMessage === '404') {
          response.status(404).end();
        } else {
          response.status(400).json({ error: transactionRespn.errorMessage });
        }
      } else {
        //transaction completed succesfully
        response.end();
      }
    } catch (err) {
      console.log(err);
      response.status(400).json({
        error: "error"
      });
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({ error: "bad_req_par_number" });
  }
});

router.put('/openStatus', authorize([adminRoleCode]), async (_request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  try {
    const changed = await handleHiringStatusChangeTransaction();
    if (changed) {
      response.end();
    } else {
      response.status(400).json({
        error: "error"
      });
    }
  } catch (err) {
    console.log(err);
    response.status(400).json({
      error: "error"
    });
  }

});

router.delete('/:id', authorize([adminRoleCode]), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.id) == request.params.id
    && parseInt(request.params.id) > 0) { // correct parameter
    try {
      const deleted = await deleteModeratorRequest(request.params.id);
      if (!deleted) {
        response.status(404);
      }
      response.end();
    } catch (err) {
      console.log(err);
      response.status(400).json({
        error: "error"
      });
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({ error: "bad_req_par_number" });
  }
});

export default router;