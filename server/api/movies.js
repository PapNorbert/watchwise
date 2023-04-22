import express from 'express';
import {
  findMovies, findMovieByKey, getMovieCount, findMoviesShort,
  insertMovieAndGenreEdges, updateMovie, deleteMovieAndEdges
} from '../db/movies_db.js'
import { createPaginationInfo } from '../util/util.js'
import { createResponseDto, createResponseDtos } from '../dto/outgoing_dto.js'
import { adminRoleCode } from '../config/UserRoleCodes.js'
import { authorize} from '../middlewares/auth.js'

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
        const [movies, count] = await Promise.all([
          findMoviesShort(page, limit),
          getMovieCount(),
        ]);
        response.json({
          "data": createResponseDtos(movies),
          "pagination": createPaginationInfo(page, limit, count)
        });
      } else {
        const [movies, count] = await Promise.all([
          findMovies(page, limit),
          getMovieCount(),
        ]);
        response.json({
          "data": createResponseDtos(movies),
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
  if (parseInt(request.params.id) == request.params.id) { // correct parameter
    const id = request.params.id;
    try {
      const movie = await findMovieByKey(id);
      if (movie != null) {
        response.json(createResponseDto(movie));
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
    let movieJson = request.body;
    const genres = movieJson.genres;
    delete movieJson.genres;
    // title	distributed_by	release_date check runtime
    const id = await insertMovieAndGenreEdges(movieJson, genres);
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
  if (parseInt(request.params.id) == request.params.id) { // correct parameter
    const id = request.params.id;
    try {
      let newMovieAttributes = request.body;
      const succesfull = await updateMovie(id, newMovieAttributes);
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
  if (parseInt(request.params.id) == request.params.id) { // correct parameter
    const id = request.params.id;
    try {
      const succesfull = await deleteMovieAndEdges(id);
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
