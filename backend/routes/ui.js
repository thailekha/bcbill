const router = require('express').Router();
const sentry = require('../services/sentry');
const _l = require('../services/logger');
const { username, isProvider, wallet, validator } = require('./validator');
const jstr = (i) => JSON.stringify(i, null, 0);

const PREFIX = '/ui';

router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', validator({username, isProvider}), async (req, res) => {
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

router.post('/login', validator({ username, wallet }), async (req, res) => {
  try {
    const {username, wallet} = req.body;
    _l(username, wallet);
    const user = await sentry.GetUser(username + '@org1.com', wallet);
    if (user.docType === 'Client') {
      return res.redirect(PREFIX + '/client');
    }
    res.redirect(PREFIX + '/login');
  } catch (err) {
    next(err);
  }
});

router.get('/client', (req, res) => {
  res.render('client/home');
});


module.exports = router;
