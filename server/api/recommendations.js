import express from 'express'
import { findRecommendations } from '../db/embedding_db.js'
import { RECOMMEND_DEFAULTS } from '../constants/recommendation.const.js';

const router = express.Router();


router.get('/:showKey', async (request, response) => {
  response.set('Content-Type', 'application/json');
  try {
    const showKey = request.params.showKey;
    const recommendations = await findRecommendations(showKey, RECOMMEND_DEFAULTS.LIMIT);
    response.status(200).json(recommendations);
} catch (err) {
    console.log(err.message);
    response.status(400).json({
      error: "error"
    });
  }

});

export default router;
