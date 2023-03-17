import express from 'express';
import { 
  insertWatchGroup, findWatchGroupByKey, findWatchGroups, updateWatchGroup, deleteWatchGroup
 } from '../db/watch_groups_db.js'
import { checkMovieExistsWithName } from '../db/movies_db.js'
import { checkSeriesExistsWithName } from '../db/series_db.js'

const router = express.Router();


router.get('', async (_request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  try {
    const watchGroup = await findWatchGroups();
    response.json(watchGroup);
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
      const watchGroup = await findWatchGroupByKey(id);
      if (watchGroup != null) {
        response.json(watchGroup);
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
    let watchGroupJson = request.body;
    if (watchGroupJson.watch_date == "" || watchGroupJson.watch_date == null) {
      response.status(400).json({
        error: "Watch group must specify the date of the event!"
      });
      return
    }
    if (watchGroupJson.location == "" || watchGroupJson.location == null) {
      response.status(400).json({
        error: "Watch group must specify the location of the event!"
      });
      return
    }

    watchGroupJson.creation_date = new Date(Date.now());

    if (watchGroupJson.show != "" && watchGroupJson.show != null ) {
      const movieExists = await checkMovieExistsWithName(watchGroupJson.show);
      const seriesExists = await checkSeriesExistsWithName(watchGroupJson.show);

      if( movieExists || seriesExists) {
        const id = await insertWatchGroup(watchGroupJson);
        response.status(201).json({id: id});
      } else {
        response.status(400).json({
          error: "The specified show does not exists in the current database."
        }); 
      }
    } else {
      response.status(400);
      response.json({
        error: "Watch group must specify the selected show name!"
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
          const succesfull = await updateWatchGroup(id, newSeriesAttributes);
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
        const succesfull = await updateWatchGroup(id, newSeriesAttributes);
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
      const succesfull = await deleteWatchGroup(id);
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
