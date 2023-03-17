import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { createCollections, createEdgeCollections } from './db/setup_db.js';

import moviesApiRoute from './api/movies.js';
import seriesApiRoute from './api/series.js';
import genresApiRoute from './api/genres.js';
import opinionThreadApiRoute from './api/opinion_threads.js';
import watchGroupApiRoute from './api/watch_groups.js';


const app = express();

// loggolas
app.use(morgan('tiny'));

// json formatum feldolgozas
app.use(bodyParser.json());


//routes
app.use('/api/movies', moviesApiRoute);
app.use('/api/series', seriesApiRoute);
app.use('/api/genres', genresApiRoute);
app.use('/api/opinion_threads', opinionThreadApiRoute);
app.use('/api/watch_groups', watchGroupApiRoute);


createCollections()
  .then(createEdgeCollections)
  .then(() => {
    app.listen(3000, () => { console.log('Server listening on http://localhost:3000/ ...'); });
  })
  .catch((err) => {
    console.log(err);
  });
