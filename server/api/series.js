import express from 'express';
import {
  insertSeriesAndGenreEdges, findSeries, findSeriesByKey, updateSeries, deleteSeriesAndEdges,
  getSeriesCount, findSeriesShort, findSeriesShortByGenreType, getSeriesCountByGenre,
  findSeriesShortByNameContains, getSeriesCountByNameContains
} from '../db/series_db.js'
import { findGenreByHisTypeEdgeFrom } from '../db/genres_db.js'
import { createPaginationInfo } from '../util/paginationInfo.js'
import { createResponseDto, createResponseDtos } from '../dto/outgoing_dto.js'
import { adminRoleCode } from '../config/UserRoleCodes.js'
import { authorize } from '../middlewares/auth.js'

const router = express.Router();


router.get('', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  try {
    let { page = 1, limit = 10, short = false, genre = 'all', name } = request.query;
    if (parseInt(page) == page && parseInt(limit) == limit
      && parseInt(page) > 0 && parseInt(limit) > 0) { // correct paging information
      page = parseInt(page);
      limit = parseInt(limit);
      if (short) {
        if (genre === 'all') {
          if(name) {
            // get series filtered by name
            const [series, count] = await Promise.all([
              findSeriesShortByNameContains(page, limit, name.toUpperCase()),
              getSeriesCountByNameContains(name.toUpperCase()),
            ]);
            response.json({
              "data": createResponseDtos(series),
              "pagination": createPaginationInfo(page, limit, count)
            });
          } else {
            // get all series
            const [series, count] = await Promise.all([
              findSeriesShort(page, limit),
              getSeriesCount(),
            ]);
            response.json({
              "data": createResponseDtos(series),
              "pagination": createPaginationInfo(page, limit, count)
            });
          }
        } else {
          // filtered by genre
          const [series, count] = await Promise.all([
            findSeriesShortByGenreType(page, limit, `genres/${genre}`),
            getSeriesCountByGenre(`genres/${genre}`),
          ]);
          response.json({
            "data": createResponseDtos(series),
            "pagination": createPaginationInfo(page, limit, count)
          });
        }
      } else {
        const [series, count] = await Promise.all([
          findSeries(page, limit),
          getSeriesCount(),
        ]);
        response.json({
          "data": createResponseDtos(series),
          "pagination": createPaginationInfo(page, limit, count)
        });
      }
    } else {
      response.status(400).json({ error: "bad_paging" })
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
  if (parseInt(request.params.id) == request.params.id
    && parseInt(request.params.id) > 0) { // correct parameter
    const id = request.params.id;
    try {
      const series = await findSeriesByKey(id);
      if (series != null) {
        response.json(createResponseDto(series));
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
    response.json({ error: "bad_req_par_number" });
  }

});

router.get('/:id/genres', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  if (parseInt(request.params.id) == request.params.id
    && parseInt(request.params.id) > 0) { // correct parameter
    const id = request.params.id;
    try {
      const series = await findSeriesByKey(id);
      if (series != null) {
        const genres = await findGenreByHisTypeEdgeFrom(series._id);
        response.json(createResponseDto(genres));
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
    response.json({ error: "bad_req_par_number" });
  }

});

router.post('', authorize([adminRoleCode]), async (request, response) => {
  response.set('Content-Type', 'application/json');
  try {
    let seriesJson = request.body;
    const genres = seriesJson.genres;
    delete seriesJson.genres;
    // check title	nr_seasons	nr_episodes	release_date
    const id = await insertSeriesAndGenreEdges(seriesJson, genres);
    response.status(201).json({ id: id });
  } catch (err) {
    console.log(err);
    response.status(400);
    response.json({
      error: "error"
    });
  }

});

router.put('/:id', authorize([adminRoleCode]), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.id) == request.params.id
    && parseInt(request.params.id) > 0) { // correct parameter
    const id = request.params.id;
    try {
      let newSeriesAttributes = request.body;
      const succesfull = await updateSeries(id, newSeriesAttributes);
      if (!succesfull) {
        response.status(404);
      }
      response.end();

    } catch (err) {
      console.log(err);
      response.status(400);
      response.json({
        error: "error"
      });
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({ error: "bad_req_par_number" });
  }

});

router.delete('/:id', authorize([adminRoleCode]), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.id) == request.params.id
    && parseInt(request.params.id) > 0) { // correct parameter
    const id = request.params.id;
    try {
      const succesfull = await deleteSeriesAndEdges(id);
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
    response.json({ error: "bad_req_par_number" });
  }

});


export default router;
