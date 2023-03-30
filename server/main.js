import express from 'express'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import cors from 'cors'

import { createCollections, createEdgeCollections } from './db/setup_db.js'
import { readLanguageDataFiles } from './i18n/i18n_files.js'
import moviesApiRoute from './api/movies.js'
import seriesApiRoute from './api/series.js'
import genresApiRoute from './api/genres.js'
import opinionThreadApiRoute from './api/opinion_threads_and_comments.js'
import watchGroupApiRoute from './api/watch_groups.js'
import languageDataFilesRoute from './api/languageDataFiles.js'


const app = express();

// loggolas
app.use(morgan('tiny'));

// json formatum feldolgozas
app.use(bodyParser.json());

// for requests from react
app.use(cors({
  origin: 'http://localhost:3800'
}))

//routes
app.use('/api/movies', moviesApiRoute);
app.use('/api/series', seriesApiRoute);
app.use('/api/genres', genresApiRoute);
app.use('/api/opinion_threads', opinionThreadApiRoute);
app.use('/api/watch_groups', watchGroupApiRoute);
app.use('/api/language', languageDataFilesRoute);


createCollections()
  .then(createEdgeCollections)
  .then(() => {
    app.listen(3000, () => { console.log('Server listening on http://localhost:3000/ ...'); });
    if( !readLanguageDataFiles("eng") ) {
      console.log('Error reading i18n data files');
    }
  })
  .catch((err) => {
    console.log(err);
  });
