import express from 'express'
import { findShows, findFilteredShows } from '../db/shows_db.js'

const router = express.Router();


router.get('', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  try {
    let { nameFilter, limit = 6 } = request.query;
    if (parseInt(limit) == limit && parseInt(limit) > 0) { // limit is a number
      limit = parseInt(limit);
      if (nameFilter) {
        const shows = await findFilteredShows(nameFilter.toUpperCase(), limit);
        response.json({ shows });
      } else {
        const shows = await findShows(limit);
        response.json({ shows });
      }
    } else {
      response.status(400).json({ error: "bad_limit" })
    }
  } catch (err) {
    console.log(err.message);
    response.status(400).json({
      error: "error"
    });
  }

});


export default router;