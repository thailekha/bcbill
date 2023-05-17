const router = require('express').Router();
const sentry = require('../services/sentry');
const _l = require('../services/logger');
const auth = require('../services/auth');
const { walletRequired, validator } = require('./validator');
const Joi = require('joi');
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
  endpointId,
  endpointAccessGrantId,
] = _.range(9).map(j => Joi.string().required());

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
  return isProvider ? 'provider_' + username : appname + '_' + username;
}

function checkIsProvider(isProviderCheckbox) {
  return isProviderCheckbox === true || isProviderCheckbox === 'on';
}

router.post('/register', validator({appname, username, isProviderCheckbox}), async (req, res, next) => {
  try {
    const {appname, username, isProviderCheckbox} = req.body;
    const isProvider = checkIsProvider(isProviderCheckbox);
    const userId = makeEntityID(appname, username, isProvider);
    const walletContent = await sentry.registerUser(userId, isProvider);
    req.flash('success', `Here is your password, please copy it since it is shown only once: ${walletContent}`);
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

router.get('/client', walletRequired, async (req, res, next) => {
  try {
    _l(...auth.creds(req));
    const client = auth.creds(req)[0];
    const data = await sentry.ClientHomepageData(...auth.creds(req));
    _l(data);
    res.render('client/home', { client: client, ulData: data });
  } catch (err) {
    next(err);
  }
});

router.get('/provider', walletRequired, async (req, res, next) => {
  try {
    _l(...auth.creds(req));
    const provider = auth.creds(req)[0];
    const data = await sentry.ApiProviderHomepageData(...auth.creds(req));
    _l(data);
    res.render('provider/home', { provider: provider, ulData: data });
  } catch (err) {
    next(err);
  }
});

router.post('/AddOriginServer', walletRequired, validator({ serverName, host }), async (req, res, next) => {
  try {
    const { serverName, host} = req.body;
    const originServer = await sentry.AddOriginServer(...auth.creds(req), serverName, host);
    return res.redirect(PREFIX + '/provider');
  } catch (err) {
    next(err);
  }
});

router.post('/AddEndpoint', walletRequired, validator({ originServerId, path, verb }), async (req, res, next) => {
  try {
    const { originServerId, path, verb } = req.body;
    await sentry.AddEndpoint(...auth.creds(req), originServerId, path, verb);
    return res.redirect(PREFIX + '/provider');
  } catch (err) {
    next(err);
  }
});

router.post('/AddEndpointAccessGrant', walletRequired, validator({ endpointId }), async (req, res, next) => {
  try {
    const { endpointId } = req.body;
    await sentry.AddEndpointAccessGrant(...auth.creds(req), endpointId);
    return res.redirect(PREFIX + '/client');
  } catch (err) {
    next(err);
  }
});

router.post('/Approve', walletRequired, validator({ endpointAccessGrantId }),async (req, res, next) => {
  try {
    const {endpointAccessGrantId} = req.body;
    await sentry.Approve(...auth.creds(req), endpointAccessGrantId);
    return res.redirect(PREFIX + '/provider');
  } catch (err) {
    next(err);
  }
});

router.post('/Revoke', walletRequired, validator({ endpointAccessGrantId }),async (req, res, next) => {
  try {
    const {endpointAccessGrantId} = req.body;
    await sentry.Revoke(...auth.creds(req), endpointAccessGrantId);
    return res.redirect(PREFIX + '/provider');
  } catch (err) {
    next(err);
  }
});

router.post('/Enable', walletRequired, validator({ endpointAccessGrantId }),async (req, res, next) => {
  try {
    const {endpointAccessGrantId} = req.body;
    await sentry.Enable(...auth.creds(req), endpointAccessGrantId);
    return res.redirect(PREFIX + '/provider');
  } catch (err) {
    next(err);
  }
});

router.get('/logout', async (req, res, next) => {
  try {
    auth.logout(req);
    return res.redirect(PREFIX + '/login');
  } catch (err) {
    next(err);
  }
});

router.use(function (err, req, res, next) {
  if (err.statusCode) {
    res.status(err.statusCode).render('error', { message: err.message });
  } else {
    res.status(500).render('error', { message: err });
  }
});


module.exports = router;
