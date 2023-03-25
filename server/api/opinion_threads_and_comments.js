import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { 
  insertOpinionThread, findOpinionThreadByKey, findOpinionThreads, updateOpinionThread, deleteOpinionThread,
  getOpinionThreadCount
} from '../db/opinion_threads_db.js'
import { checkMovieExistsWithName } from '../db/movies_db.js'
import { checkSeriesExistsWithName } from '../db/series_db.js'
import { 
  findComments, findCommentByKey, insertComment, deleteComment,
} from '../db/comments_db.js'
import { createPaginationInfo } from '../util/util.js'
import { createResponseDto, createResponseDtos } from '../dto/outgoing_dto.js'


const router = express.Router();


// comments 


router.get('/:thread_id/comments', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  if (parseInt(request.params.thread_id) == request.params.thread_id ) { // correct parameter
    const thread_id = request.params.thread_id;
    try {
      const comments = await findComments(thread_id);
      response.json(comments);
    } catch (err) {
      console.log(err);
      response.status(400);
      response.json({
        error: "error"
      }); 
    }

  } else { // incorrect parameter
    response.status(400);
    response.json({error: "Bad request parameter, not a number!"});
  }

});

router.get('/:thread_id/comments/:id', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  if (parseInt(request.params.thread_id) == request.params.thread_id) { // correct parameter

    const thread_id = request.params.thread_id;
    const id = request.params.id;
    try {
      const comments = await findCommentByKey(thread_id,id);
      if (comments[0]) {
        response.json(comments[0]);
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
    response.json({error: "Bad request parameter, not a number!"});
  }

});

router.post('/:thread_id/comments', async (request, response) => {
  response.set('Content-Type', 'application/json');
  if (parseInt(request.params.thread_id) == request.params.thread_id ) { // correct parameter
    const thread_id = request.params.thread_id;
    try {
      let commentJson = request.body;

      if (commentJson.user != "" && commentJson.user != null) {
        commentJson.creation_date = new Date(Date.now());
        commentJson.key = uuidv4();
        const id = await insertComment(thread_id, commentJson);
        response.status(201).json({id: id});
      } else { // no user specified
        response.status(400).json({error: "Bad request parameter, not a number!"});
      }
      
    } catch (err) {
      console.log(err);
      response.status(400);
      response.json({
        error: "error"
      }); 
    }
  } else { // incorrect parameter
    response.status(400).json({error: "Bad request parameter, not a number!"});
  }

});

router.delete('/:thread_id/comments/:id', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.thread_id) == request.params.thread_id) { // correct parameter

    const thread_id = request.params.thread_id;
    const id = request.params.id;
    try {
      const succesfull = await deleteComment(thread_id, id);
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
    response.json({error: "Bad request parameter, not a number!"});
  }

});



// opinion_threads



router.get('', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  try {
    let { page = 1, limit = 10 } = request.query;
    if (parseInt(page) == page && parseInt(limit) == limit) { // correct paging information
      page = parseInt(page);
      limit= parseInt(limit);
      const [opinion_threads, count] = await Promise.all([
        findOpinionThreads(page, limit),
        getOpinionThreadCount(),
      ]); 
      response.json({
        "data": createResponseDtos(opinion_threads),
        "pagination": createPaginationInfo(page, limit, count)
      });
    } else {
      response.status(400).json({error: "Bad paging information!"})
    }
  } catch (err) {
    console.log(err);
    response.status(400);
    response.json({
      error: "error"
    }); 
  }

});

router.get('/:id', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  if (parseInt(request.params.id) == request.params.id) { // correct parameter
    const id = request.params.id;
    try {
      const opinionThread = await findOpinionThreadByKey(id);
      if (opinionThread != null) {
        response.json(createResponseDto(opinionThread));
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
    response.json({error: "Bad request parameter, not a number!"});
  }

});

router.post('', async (request, response) => {
  response.set('Content-Type', 'application/json');
  try {
    let opinionThreadJson = request.body;
    opinionThreadJson.creation_date = new Date(Date.now());
    opinionThreadJson.comments = [];

    if (opinionThreadJson.show != "" && opinionThreadJson.show != null ) {
      const movieExists = await checkMovieExistsWithName(opinionThreadJson.show);
      const seriesExists = await checkSeriesExistsWithName(opinionThreadJson.show);

      if( movieExists || seriesExists) {
        const id = await insertOpinionThread(opinionThreadJson);
        response.status(201).json({id: id});
      } else {
        response.status(400).json({
          error: "The specified show does not exists in the current database."
        }); 
      }
    } else {
      response.status(400);
      response.json({
        error: "Opinion thread must specify the selected show name!"
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

router.put('/:id', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.id) == request.params.id) { // correct parameter
    const id = request.params.id;
    try {
      let newSeriesAttributes = request.body;

      if (newSeriesAttributes.show != "" && newSeriesAttributes.show != null ) {
          // new attributes change the show
        const movieExists = await checkMovieExistsWithName(newSeriesAttributes.show);
        const seriesExists = await checkSeriesExistsWithName(newSeriesAttributes.show);
  
        if( movieExists || seriesExists) {
          const succesfull = await updateOpinionThread(id, newSeriesAttributes);
          if (!succesfull) {
            response.status(404);
          }
          response.end();
        } else {
          response.status(400).json({
            error: "The specified show does not exists in the current database."
          }); 
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
        error: "error"
      }); 
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({error: "Bad request parameter, not a number!"});
  }

});

router.delete('/:id', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.id) == request.params.id) { // correct parameter
    const id = request.params.id;
    try {
      const succesfull = await deleteOpinionThread(id);
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
    response.json({error: "Bad request parameter, not a number!"});
  }

});


export default router;

