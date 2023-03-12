const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const path = require('path');
const api = require('./routes/api');
const ui = require('./routes/web');

const app = express();
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());
app.use(session({
  secret: 'mysecret',
  resave: true,
  saveUninitialized: true,

  // set true for HTTPS
  cookie: { secure: false }
}));
app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.info = req.flash('info');
  res.locals.warning = req.flash('warning');
  res.locals.danger = req.flash('danger');
  next();
});
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('view engine', 'pug');
app.use('/ui', ui);
app.use('/api', api);


module.exports = app;

