import express from 'express';

import { authorize } from '../middlewares/auth.js'
import { handleShowRatedTransaction } from '../db/rating_edge_db.js';
import { validateRatingData } from '../util/ratingValidation.js';

const router = express.Router();

router.post('', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  try {
    let ratingRequestJson = request.body;
    const { correct, error } = await validateRatingData(ratingRequestJson);
    if (correct) {
      const transactionRespn = await handleShowRatedTransaction(
        ratingRequestJson.showType, ratingRequestJson.showKey,
        response.locals.payload.username, parseFloat(ratingRequestJson.newRating)
      );
      if (transactionRespn.error) {
        if (transactionRespn.errorMessage === '404') {
          response.sendStatus(404);
          return
        } else {
          response.status(400).json({ error: transactionRespn.errorMessage });
          return
        }
      } else {
        if (transactionRespn.actionPerformed === 'rating_updated') {
          response.sendStatus(204);
          return
        }
        if (transactionRespn.actionPerformed === 'rating_saved') {
          response.status(201).json({ id: transactionRespn.key })
          return
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

export default router;
