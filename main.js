import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { createCollections, createEdgeCollections } from './db/setup_db.js';



const app = express();

// loggolas
app.use(morgan('tiny'));

// json formatum feldolgozas
app.use(bodyParser.json());

createCollections()
  .then(createEdgeCollections)
  .then(() => {
    app.listen(3000, () => { console.log('Server listening on http://localhost:3000/ ...'); });
  })
  .catch((err) => {
    console.log(err);
  });
