import express from 'express';
import {
  insertWatchGroup, findWatchGroupByKey, findWatchGroups, updateWatchGroup, deleteWatchGroup,
  getWatchGroupCount, findWatchGroupsByCreator, getWatchGroupCountByCreator
} from '../db/watch_groups_db.js'
import { getMovieKeyByName } from '../db/movies_db.js'
import { getSerieKeyByName } from '../db/series_db.js'
import { createPaginationInfo } from '../util/util.js'
import { createResponseDto, createResponseDtos } from '../dto/outgoing_dto.js'
import { validateWatchGroupCreation } from '../util/watchGroupValidation.js'

const router = express.Router();


router.get('', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  try {
    let { page = 1, limit = 10, creator } = request.query;
    if (parseInt(page) == page && parseInt(limit) == limit) { // correct paging information
      page = parseInt(page);
      limit = parseInt(limit);
      if (creator) {
        const [watchGroups, count] = await Promise.all([
          findWatchGroupsByCreator(creator, page, limit),
          getWatchGroupCountByCreator(creator),
        ]);
        response.json({
          "data": createResponseDtos(watchGroups),
          "pagination": createPaginationInfo(page, limit, count)
        });
      } else {
        const [watchGroups, count] = await Promise.all([
          findWatchGroups(page, limit),
          getWatchGroupCount(),
        ]);
        response.json({
          "data": createResponseDtos(watchGroups),
          "pagination": createPaginationInfo(page, limit, count)
        });
      }
    } else {
      response.status(400).json({ error: "Bad paging information!" })
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
      const watchGroup = await findWatchGroupByKey(id);
      if (watchGroup != null) {
        response.json(createResponseDto(watchGroup));
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
    response.json({ error: "Bad request parameter, not a number!" });
  }

});

router.post('', async (request, response) => {
  response.set('Content-Type', 'application/json');
  try {
    let watchGroupJson = request.body;
    const { correct, error } = await validateWatchGroupCreation(watchGroupJson);
    if (correct) {
      watchGroupJson.creation_date = new Date(Date.now());
      const movieKey = await getMovieKeyByName(watchGroupJson.show);
      if (movieKey) {
        watchGroupJson['show_id'] = movieKey;
        watchGroupJson['show_type'] = 'movie';
        const id = await insertWatchGroup(watchGroupJson);
        response.status(201).json({ id: id });
      } else {
        // movie not found, check series
        const seriesKey = await getSerieKeyByName(watchGroupJson.show);
        if (seriesKey) {
          watchGroupJson['show_id'] = seriesKey;
          watchGroupJson['show_type'] = 'serie';
          const id = await insertWatchGroup(watchGroupJson);
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

      if (newSeriesAttributes.show !== "" && newSeriesAttributes.show !== null) {
        // new attributes change the show
        const movieExists = await checkMovieExistsWithName(newSeriesAttributes.show);
        const seriesExists = await checkSeriesExistsWithName(newSeriesAttributes.show);

        if (movieExists || seriesExists) {
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
    response.json({ error: "Bad request parameter, not a number!" });
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
    response.json({ error: "Bad request parameter, not a number!" });
  }

});


export default router;
