import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  insertOpinionThread, findOpinionThreadByKey, findOpinionThreads, updateOpinionThread,
  deleteOpinionThreadAndEdges, getOpinionThreadCount, findOpinionThreadsWithFollowedInformation,
  findOpinionThreadsByCreator, findOpinionThreadsByUserFollowed,
  getOpinionThreadCountByCreator, getOpinionThreadCountByUserFollowed,
  findOpinionThreadByKeyWithFollowedInformation, findOpinionThreadByKeyWithoutComments
} from '../db/opinion_threads_db.js'
import { getMovieKeyByName } from '../db/movies_db.js'
import { getSerieKeyByName } from '../db/series_db.js'
import {
  findComments, findCommentByKey, insertComment, deleteComment,
  getCommentCountForThreadByKey, updateComment
} from '../db/comments_db.js'
import {
  checkEdgeExists, insertFollowedEdge, deleteFollowedEdge
} from '../db/followed_thread_db.js'
import { findUserByUsername } from '../db/users_db.js'
import { createPaginationInfo } from '../util/paginationInfo.js'
import { createResponseDtos, createResponseDtosLoggedIn } from '../dto/outgoing_dto.js'
import { validateOpinionTreadCreation } from '../util/opinionThreadValidation.js'
import { validateCommentCreation } from '../util/commentValidation.js'
import { authorize } from '../middlewares/auth.js'


const router = express.Router();


// comments 


router.get('/:thread_id/comments', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  if (parseInt(request.params.thread_id) == request.params.thread_id
    && parseInt(request.params.thread_id) > 0) { // correct parameter
    const thread_id = request.params.thread_id;
    try {
      const comments = await findComments(thread_id, 'opinion_threads');
      response.json(comments);
    } catch (err) {
      console.log(err);
      response.status(400);
      response.json({
        error: 'error'
      });
    }

  } else { // incorrect parameter
    response.status(400);
    response.json({ error: 'bad_req_par_number' });
  }

});

router.get('/:thread_id/comments/:id', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  if (parseInt(request.params.thread_id) == request.params.thread_id
    && parseInt(request.params.thread_id) > 0) { // correct parameter

    const thread_id = request.params.thread_id;
    const id = request.params.id;
    try {
      const comment = await findCommentByKey(thread_id, id, 'opinion_threads');
      if (comment) {
        response.json(comment);
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
    response.json({ error: 'bad_req_par_number' });
  }

});

router.post('/:thread_id/comments', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  if (parseInt(request.params.thread_id) == request.params.thread_id
    && parseInt(request.params.thread_id) > 0) { // correct parameter
    const thread_id = request.params.thread_id;
    try {
      let commentJson = request.body;
      const { correct, error } = await validateCommentCreation(commentJson);
      if (correct) {
        commentJson.creation_date = new Date(Date.now());
        commentJson.key = uuidv4();
        const id = await insertComment(thread_id, commentJson, 'opinion_threads');
        response.status(201).json({ id: id });
      } else { // invalid comment
        response.status(400).json({
          error: error
        });
      }
    } catch (err) {
      console.log(err);
      response.status(400).json({ error: 'error' });
    }
  } else { // incorrect parameter
    response.status(400).json({ error: 'bad_req_par_number' });
  }

});

router.put('/:thread_id/comments/:id', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.thread_id) == request.params.thread_id
    && parseInt(request.params.thread_id) > 0) { // correct parameter
    const thread_id = request.params.thread_id;
    const id = request.params.id;
    const comment = await findCommentByKey(thread_id, id, 'opinion_threads');
    if (comment.user !== response.locals.payload.username) {
      response.sendStatus(403);
      return
    }
    let commentJson = request.body;
    if (commentJson.text === undefined || commentJson.text === '') {
      response.status(400);
      response.json({ error: 'empty_comment' });
    } else {
      try {
        const succesfull = await updateComment(thread_id, id, commentJson.text, 'opinion_threads');
        // can only update the text
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
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({ error: 'bad_req_par_number' });
  }

});

router.delete('/:thread_id/comments/:id', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.thread_id) == request.params.thread_id
    && parseInt(request.params.thread_id) > 0) { // correct parameter
    const thread_id = request.params.thread_id;
    const id = request.params.id;
    const comment = await findCommentByKey(thread_id, id, 'opinion_threads');
    if (comment.user !== response.locals.payload.username) {
      response.sendStatus(403);
      return
    }
    try {
      const succesfull = await deleteComment(thread_id, id, 'opinion_threads');
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
    response.json({ error: 'bad_req_par_number' });
  }

});



// opinion_threads



router.get('', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  try {
    let { page = 1, limit = 10, creator, followed = false, userId } = request.query;
    if (parseInt(page) == page && parseInt(limit) == limit
      && parseInt(page) > 0 && parseInt(limit) > 0) { // correct paging information
      page = parseInt(page);
      limit = parseInt(limit);
      if (creator) {
        // searching for opinion threads that the user created
        if (creator !== response.locals.payload.username) {
          response.sendStatus(403);
          return
        }
        const [opinion_threads, count] = await Promise.all([
          findOpinionThreadsByCreator(creator, page, limit),
          getOpinionThreadCountByCreator(creator),
        ]);
        response.json({
          'data': createResponseDtos(opinion_threads),
          'pagination': createPaginationInfo(page, limit, count)
        });
      } else if (followed && userId) {
        // searching for opinion threads that the user follows
        if (userId !== response.locals.payload?.userID) {
          response.sendStatus(403);
          return
        }
        const [opinion_threads, count] = await Promise.all([
          findOpinionThreadsByUserFollowed(`users/${response.locals.payload.userID}`, page, limit),
          getOpinionThreadCountByUserFollowed(`users/${response.locals.payload.userID}`),
        ]);
        response.json({
          'data': createResponseDtos(opinion_threads),
          'pagination': createPaginationInfo(page, limit, count)
        });
      } else {
        // searching for all opinion threads
        if (response.locals?.payload?.userID) {
          // logged in
          const [opinion_threads, count] = await Promise.all([
            findOpinionThreadsWithFollowedInformation(`users/${response.locals.payload.userID}`, page, limit),
            getOpinionThreadCount(),
          ]);
          response.json({
            'data': createResponseDtosLoggedIn(opinion_threads),
            'pagination': createPaginationInfo(page, limit, count)
          });
        } else {
          // not logged in
          const [opinion_threads, count] = await Promise.all([
            findOpinionThreads(page, limit),
            getOpinionThreadCount(),
          ]);
          response.json({
            'data': createResponseDtos(opinion_threads),
            'pagination': createPaginationInfo(page, limit, count)
          });
        }

      }
    } else {
      response.status(400).json({ error: 'bad_paging' });
    }
  } catch (err) {
    console.log(err);
    response.status(400);
    response.json({
      error: 'error'
    });
  }

});

router.get('/:thread_id', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  if (parseInt(request.params.thread_id) == request.params.thread_id) { // correct parameter
    try {
      let { page = 1, limit = 10 } = request.query;
      if (parseInt(page) == page && parseInt(limit) == limit
        && parseInt(page) > 0 && parseInt(limit) > 0) { // correct paging information
        page = parseInt(page);
        limit = parseInt(limit);
        if (response.locals?.payload?.userID) {
          // logged in
          const [opinionThread, count] = await Promise.all([
            findOpinionThreadByKeyWithFollowedInformation(
              `users/${response.locals.payload.userID}`, request.params.thread_id, page, limit),
            getCommentCountForThreadByKey(request.params.thread_id),
          ]);

          if (opinionThread != null) {
            response.json({
              'data': opinionThread,
              'pagination': createPaginationInfo(page, limit, count)
            });
          } else { // no entity found with thread_id
            response.status(404).end();
          }
        } else {
          // not logged in
          const [opinionThread, count] = await Promise.all([
            findOpinionThreadByKey(request.params.thread_id, page, limit),
            getCommentCountForThreadByKey(request.params.thread_id),
          ]);

          if (opinionThread != null) {
            response.json({
              'data': opinionThread,
              'pagination': createPaginationInfo(page, limit, count)
            });
          } else { // no entity found with thread_id
            response.status(404).end();
          }
        }
      } else {
        // page and limit not numbers
        response.status(400).json({ error: 'bad_paging' })
      }
    } catch (err) {
      console.log(err.message);
      response.status(400).json({
        error: err.message
      });
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({ error: 'bad_req_par_number' });
  }

});

router.post('', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  try {
    let opinionThreadJson = request.body;
    const { correct, error } = await validateOpinionTreadCreation(opinionThreadJson);
    if (correct) {
      opinionThreadJson.creation_date = new Date(Date.now());
      opinionThreadJson.comments = [];
      const movieKey = await getMovieKeyByName(opinionThreadJson.show);
      if (movieKey) {
        opinionThreadJson['show_id'] = movieKey;
        opinionThreadJson['show_type'] = 'movie';
        const id = await insertOpinionThread(opinionThreadJson);
        response.status(201).json({ id: id });
      } else {
        // movie not found, check series
        const seriesKey = await getSerieKeyByName(opinionThreadJson.show);
        if (seriesKey) {
          opinionThreadJson['show_id'] = seriesKey;
          opinionThreadJson['show_type'] = 'serie';
          const id = await insertOpinionThread(opinionThreadJson);
          response.status(201).json({ id: id });
        } else {
          // show not found
          response.status(400).json({
            error: 'show_not_exists'
          });
        }
      }
    } else {
      response.status(400).json({
        error: error
      });
    }

  } catch (err) {
    console.log(err);
    response.status(400);
    response.json({
      error: 'error'
    });
  }

});

router.post('/:thread_id/followes', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.thread_id) == request.params.thread_id
    && parseInt(request.params.thread_id) > 0) { // correct parameter
    const id = request.params.thread_id;
    try {
      const opinionThread = await findOpinionThreadByKeyWithoutComments(id);
      const user = await findUserByUsername(response.locals.payload.username);
      if (opinionThread !== null && user !== null) {
        const exists = await checkEdgeExists(user._id, opinionThread._id);
        if (exists) {
          const deleted = await deleteFollowedEdge(user._id, opinionThread._id);
          if (!deleted) {
            response.status(404);
          }
          response.end();
        } else {
          const key = await insertFollowedEdge(user._id, opinionThread._id);
          response.status(201).json({ id: key })
        }
      } else { // watchgroup or user not found
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
    response.json({ error: 'bad_req_par_number' });
  }

});

router.put('/:id', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.id) == request.params.id
    && parseInt(request.params.id) > 0) { // correct parameter
    const id = request.params.id;
    try {
      const opinionThread = await findOpinionThreadByKeyWithoutComments(id);
      if (opinionThread.creator !== response.locals.payload.username) {
        response.sendStatus(403);
        return
      }
      let newSeriesAttributes = request.body;

      if (newSeriesAttributes.show !== undefined && newSeriesAttributes.show !== '') {
        // new attributes change the show
        const movieKey = await getMovieKeyByName(opinionThreadJson.show);
        if (movieKey) {
          newSeriesAttributes['show_id'] = movieKey;
          newSeriesAttributes['show_type'] = 'movie';
          const succesfull = await updateOpinionThread(id, newSeriesAttributes);
          if (!succesfull) {
            response.status(404);
          }
          response.end();
        } else {
          // movie not found, check series
          const seriesKey = await getSerieKeyByName(newSeriesAttributes.show);
          if (seriesKey) {
            newSeriesAttributes['show_id'] = seriesKey;
            newSeriesAttributes['show_type'] = 'serie';
            const succesfull = await updateOpinionThread(id, newSeriesAttributes);
            if (!succesfull) {
              response.status(404);
            }
            response.end();
          } else {
            // show not found
            response.status(400).json({
              error: 'show_not_exists'
            });
          }
        }
      } else { // does not change the show
        const succesfull = await updateOpinionThread(id, newSeriesAttributes);
        if (!succesfull) {
          response.status(404);
        }
        response.end();
      }

    } catch (err) {
      console.log(err);
      response.status(400);
      response.json({
        error: 'error'
      });
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({ error: 'bad_req_par_number' });
  }

});

router.delete('/:id', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.id) == request.params.id
    && parseInt(request.params.id) > 0) { // correct parameter
    const id = request.params.id;
    try {
      const opinionThread = await findOpinionThreadByKeyWithoutComments(id);
      if (opinionThread.creator !== response.locals.payload.username) {
        response.sendStatus(403);
        return
      }
      const succesfull = await deleteOpinionThreadAndEdges(id);
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
    response.json({ error: 'bad_req_par_number' });
  }

});


export default router;

