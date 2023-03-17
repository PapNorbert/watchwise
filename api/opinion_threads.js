import express from 'express';
import { 
  insertOpinionThread, findOpinionThreadByKey, findOpinionThreads, updateOpinionThread, deleteOpinionThread
 } from '../db/opinion_threads_db.js'
import { checkMovieExistsWithName } from '../db/movies_db.js'
import { checkSeriesExistsWithName } from '../db/series_db.js'

const router = express.Router();


router.get('', async (_request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  try {
    const opinionThread = await findOpinionThreads();
    response.json(opinionThread);
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
        response.json(opinionThread);
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
