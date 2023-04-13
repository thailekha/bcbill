const router = require('express').Router();
const D3Node = require('d3-node');
const sentry = require('../services/sentry');
const _l = require('../services/logger');
const auth = require('../services/auth');
const { username, appname, wallet, validator, isProviderCheckbox} = require('./validator');
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
    const walletContent = await sentry.registerUser(makeEntityID(appname, username, isProvider), isProvider);
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
    const {appname, username, wallet, isProviderCheckbox} = req.body;
    const isProvider = checkIsProvider(isProviderCheckbox);
    const entityID = makeEntityID(appname, username, isProvider)
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

  const ulData = {
    "ApiProviders": data.ApiProvider.map(provider => ({
      ...provider,
      "OriginServers": data.OriginServer.filter(server => server.providerEntityID === provider.entityID).map(server => ({
        ...server,
        "Endpoints": data.Endpoint.filter(endpoint => endpoint.originServerId === server.id).map(endpoint => ({
          ...endpoint,
          "EndpointAccessGrant": data.EndpointAccessGrant.filter(access => access.endpointId === endpoint.id && access.clientEntityID === client)
        }))
      }))
    }))
  }

  _l(ulData);

  res.render('client/home', { client: client, ulData: ulData });
});


module.exports = router;
