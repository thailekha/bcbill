const router = require('express').Router();
const sentry = require('../services/sentry');
const _l = require('../services/logger');
const auth = require('../services/auth');
const { username, isProvider, wallet, validator } = require('./validator');
const jstr = (i) => JSON.stringify(i, null, 0);

const PREFIX = '/ui';

function walletRequired(req, res, next) {
  if (!auth.isLoggedIn(req)) {
    req.flash('danger', 'Please login first');
    res.redirect(PREFIX + '/login');
  } else {
    next();
  }
}

router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', validator({username, isProvider}), async (req, res, next) => {
  try {
    const {username, isProvider} = req.body;
    const walletContent = await sentry.registerUser(username + '@org1.com', isProvider === true || isProvider === 'on');
    req.flash('success', `Here is your wallet: ${jstr(walletContent)}`);
    res.redirect(PREFIX + '/register');
  } catch (err) {
    next(err);
  }
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', validator({ username, wallet }), async (req, res, next) => {
  try {
    const {username, wallet} = req.body;
    const user = await sentry.GetUser(username + '@org1.com', wallet);
    if (user.docType === 'Client') {
      auth.login(req, username, wallet);
      return res.redirect(PREFIX + '/client');
    }
    res.redirect(PREFIX + '/login');
  } catch (err) {
    next(err);
  }
});

router.get('/client', walletRequired, async (req, res) => {
  _l(...auth.creds(req));
  const data = await sentry.ClientHomepageData(...auth.creds(req));
  _l(data);
  res.render('client/home');
});


module.exports = router;
