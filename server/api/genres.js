import express from 'express';
import {
  findGenres, findGenreByKey, insertGenre, updateGenre, deleteGenreAndEdges,
  getGenreCount, findAllGenres
} from '../db/genres_db.js'
import { createPaginationInfo } from '../util/util.js'
import { createResponseDto, createResponseDtos } from '../dto/outgoing_dto.js'
import { adminRoleCode } from '../config/UserRoleCodes.js'
import { authorize } from '../middlewares/auth.js'

const router = express.Router();


router.get('', async (_request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  try {
    const genres = await findAllGenres();
    response.json(createResponseDtos(genres));
  } catch (err) {
    console.log(err);
    response.status(400).json({
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
      const genres = await findGenreByKey(id);
      if (genres != null) {
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
    let genresJson = request.body;
    const id = await insertGenre(genresJson);
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
      let newGenreAttributes = request.body;
      const succesfull = await updateGenre(id, newGenreAttributes);
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
      const succesfull = await deleteGenreAndEdges(id);
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
