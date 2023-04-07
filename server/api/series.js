import express from 'express';
import {
  insertSeriesAndGenreEdges, findSeries, findSeriesByKey, updateSeries, deleteSeriesAndEdges,
  getSeriesCount, findSeriesShort
} from '../db/series_db.js'
import { createPaginationInfo } from '../util/util.js'
import { createResponseDto, createResponseDtos } from '../dto/outgoing_dto.js'

const router = express.Router();


router.get('', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  try {
    let { page = 1, limit = 10, short = false } = request.query;
    if (parseInt(page) == page && parseInt(limit) == limit) { // correct paging information
      page = parseInt(page);
      limit = parseInt(limit);
      if (short) {
        const [series, count] = await Promise.all([
          findSeriesShort(page, limit),
          getSeriesCount(),
        ]);
        response.json({
          "data": createResponseDtos(series),
          "pagination": createPaginationInfo(page, limit, count)
        });
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
    response.json({ error: "Bad request parameter, not a number!" });
  }

});

router.post('', async (request, response) => {
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

router.put('/:id', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.id) == request.params.id) { // correct parameter
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
    response.json({ error: "Bad request parameter, not a number!" });
  }

});

router.delete('/:id', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.id) == request.params.id) { // correct parameter
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
    response.json({ error: "Bad request parameter, not a number!" });
  }

});


export default router;
