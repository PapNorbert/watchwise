import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { createCollections, createEdgeCollections } from './db/setup_db.js';

import moviesApiRoute from './api/movies.js';

const app = express();

// loggolas
app.use(morgan('tiny'));

// json formatum feldolgozas
app.use(bodyParser.json());


//routes
app.use('/api/movies',  moviesApiRoute);



createCollections()
  .then(createEdgeCollections)
  .then(() => {
    app.listen(3000, () => { console.log('Server listening on http://localhost:3000/ ...'); });
  })
  .catch((err) => {
    console.log(err);
  });
