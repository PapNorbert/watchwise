import express from 'express';
import { getCurrentLanguage, readSelectedLanguageDataFile } from '../i18n/conversion.js'

const router = express.Router();

router.get('', (_request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200).json({ "language": getCurrentLanguage() })

});

router.post('', (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  let languageJson = request.body;
  if ( languageJson.language ) {
    const succesfull = readSelectedLanguageDataFile(languageJson.language);
    if (succesfull) {
      response.json({ "language": getCurrentLanguage() });
    } else {
      response.status(400).json({ "error": "Selected language not found, default selected." })
    }
    
  } else {
    response.status(400).json({ "error": "No language selected"});
  }
  

});

export default router;