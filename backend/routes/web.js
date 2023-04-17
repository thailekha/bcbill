const router = require('express').Router();
const sentry = require('../services/sentry');
const _l = require('../services/logger');
const auth = require('../services/auth');
const { walletRequired, validator } = require('./validator');
const Joi = require("joi");
const _ = require('lodash');
const jstr = (i) => JSON.stringify(i, null, 0);

//##############################
// Joi start
//##############################

const appname = Joi.string().allow(null, '');
const isProviderCheckbox = Joi.boolean().default(false).truthy('on');
const [
  username,
  wallet,
  serverName,
  host,
  originServerId,
  path,
  verb,
] = _.range(7).map(j => Joi.string().required());

//##############################
// Joi end
//##############################

const PREFIX = '/ui';

router.get('/demo', (req, res) => {
  res.render('demo');
});

router.get('/register', (req, res) => {
  res.render('register');
});

function makeEntityID(appname, username, isProvider) {
  return isProvider ? username : appname + '_' + username;
}

function checkIsProvider(isProviderCheckbox) {
  return isProviderCheckbox === true || isProviderCheckbox === 'on';
}

router.post('/register', validator({appname, username, isProviderCheckbox}), async (req, res, next) => {
  try {
    const {appname, username, isProviderCheckbox} = req.body;
    const isProvider = checkIsProvider(isProviderCheckbox);
    const walletContent = await sentry.registerUser(isProvider ? 'provider_' + username : appname + '_' + username, isProvider);
    req.flash('success', `Here is your password: ${walletContent}`);
    res.redirect(PREFIX + '/login');
  } catch (err) {
    next(err);
  }
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', validator({ appname, username, wallet, isProviderCheckbox }), async (req, res, next) => {
  try {
    const { appname, username, wallet, isProviderCheckbox } = req.body;
    const isProvider = checkIsProvider(isProviderCheckbox);
    const entityID = makeEntityID(appname, username, isProvider);
    const user = await sentry.GetUser(entityID, wallet);
    if (user.docType === 'Client') {
      auth.login(req, entityID, wallet);
      return res.redirect(PREFIX + '/client');
    }
    else if (user.docType === 'ApiProvider') {
      auth.login(req, entityID, wallet);
      return res.redirect(PREFIX + '/provider');
    }

    // not match any user docType
    res.redirect(PREFIX + '/register');
  } catch (err) {
    next(err);
  }
});

router.get('/client', walletRequired, async (req, res) => {
  _l(...auth.creds(req));
  const client = auth.creds(req)[0];
  const data = await sentry.ClientHomepageData(...auth.creds(req));
  _l(data);
  res.render('client/home', { client: client, ulData: data });
});

router.get('/provider', walletRequired, async (req, res) => {
  _l(...auth.creds(req));
  const provider = auth.creds(req)[0];
  const data = await sentry.ApiProviderHomepageData(...auth.creds(req));
  _l(data);
  res.render('provider/home', { provider: provider, ulData: data });
});

router.post('/AddOriginServer', walletRequired, validator({ serverName, host }), async (req, res) => {
  const { serverName, host} = req.body;
  await sentry.AddOriginServer(...auth.creds(req), serverName, host);
  return res.redirect(PREFIX + '/provider');
});

router.post('/AddEndpoint', walletRequired, validator({ originServerId, path, verb }), async (req, res) => {
  const { originServerId, path, verb } = req.body;
  await sentry.AddEndpoint(...auth.creds(req), originServerId, path, verb);
  return res.redirect(PREFIX + '/provider');
});

module.exports = router;
