import express from 'express';

import { authorize } from '../middlewares/auth.js'
import { adminRoleCode, moderatorRoleCode } from '../config/UserRoleCodes.js'
import { createResponseDtos } from '../dto/outgoing_dto.js'
import { createPaginationInfo } from '../util/paginationInfo.js'
import {
  findAnnouncements, insertAnnouncement, deleteAnnouncement,
  getAnnouncementsCount
} from '../db/announcements_db.js'


const router = express.Router();


function validateAnnouncementCreation(announcementJson) {
  let error = null
  let correct = true

  if (announcementJson.text === '' || announcementJson.text === null) {
    error = 'empty_ann_text';
    correct = false;
  }
  if (announcementJson.title === '' || announcementJson.title === null) {
    error = 'empty_title';
    correct = false;
  }

  return { correct, error }
}



router.get('', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  try {
    let { page = 1, limit = 5} = request.query;
    if (parseInt(page) == page && parseInt(limit) == limit
      && parseInt(page) > 0 && parseInt(limit) > 0) { // correct paging information
      page = parseInt(page);
      limit = parseInt(limit);
      const [announcements, count] = await Promise.all([
        findAnnouncements(page, limit),
        getAnnouncementsCount(),
      ]);
      response.json({
        "data": createResponseDtos(announcements),
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


router.post('', authorize([adminRoleCode]), async (request, response) => {
  response.set('Content-Type', 'application/json');
  try {
    let announcementJson = request.body;
    const { correct, error } = validateAnnouncementCreation(announcementJson);
    if (correct) {
      announcementJson.creation_date = new Date(Date.now());
      const id = await insertAnnouncement(announcementJson);
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


router.delete('/:id', authorize([adminRoleCode]), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.id) == request.params.id
    && parseInt(request.params.id) > 0) { // correct parameter
    try {
      const deleted = await deleteAnnouncement(request.params.id);
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