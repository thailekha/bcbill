const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const apiRouter = require('./routes/api');
const commonUiRouter = require('./routes/commonUiRoutes');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.set('view engine', 'pug');
app.use('/ui', commonUiRouter);
app.use(apiRouter);


module.exports = app;

