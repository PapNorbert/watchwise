import express from 'express';

import { i18nData_hu, i18nData_eng } from '../i18n/i18n_files.js'

const router = express.Router();


router.get('/:lang', (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  if ( request.params.lang === 'hu' ) {
    response.json(i18nData_hu);
  } else {
    if (request.params.lang !== 'eng') {
      console.log(`Error, not found ${request.params.lang} language data`);
    }
    response.json(i18nData_eng);
  }
  
});

export default router;