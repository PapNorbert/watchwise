import express from 'express'
import { findFilteredTags, findTags } from '../db/tags_db.js'

const router = express.Router();


router.get('', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  try {
    let { nameFilter, limit = 20 } = request.query;
    if (parseInt(limit) == limit && parseInt(limit) > 0) { // limit is a number
      limit = parseInt(limit);
      if (nameFilter) {
        const tags = await findFilteredTags(nameFilter.toUpperCase(), limit);
        response.json({ tags });
      } else {
        const tags = await findTags(limit);
        response.json({ tags });
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