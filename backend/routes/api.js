const router = require('express').Router();
const sentry = require('../services/sentry');
const url = require("url");
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();

router.post('/register', async (req, res, next) => {
  try {
    const {email, isProvider} = req.body;
    const walletContent = await sentry.registerUser(email, isProvider);
    res.json({ walletContent });
  } catch (err) {
    next(err);
  }
});

router.all('/origin-server/*', async (req, res, next) => {
  try {
    const { pathname, search } = url.parse(req.url, true);
    const { email, wallet, endpointAccessGrantId } = JSON.parse(req.headers.auth);
    const originServerInfo = await sentry.GetOriginServerInfo(email, wallet, endpointAccessGrantId);
    if (!originServerInfo) {
      const err = new Error('Unauthorized');
      err.statusCode = 401;
      return next(err);
    }
    const { host: originServerHost, path: authorizedPath, verb: authorizedVerb } = originServerInfo;
    const [originServerName, ...endpointPath] = pathname.slice('/origin-server/'.length).split('/');
    const finalAuthorizedCheck = authorizedPath === endpointPath.join('/') && authorizedVerb.toUpperCase() === req.method;

    if (!finalAuthorizedCheck) {
      const err = new Error('Bad path / verb');
      err.statusCode = 400;
      return next(err);
    }

    req.url = '/' + endpointPath.join('/') + (search ? search : '');

    proxy.web(req, res, { target: originServerHost, changeOrigin: true }, (error) => {
      // Handle errors that occur when forwarding the request
      console.error(`Error forwarding request: ${error}`);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`An error occurred: ${error}`);
    });
  } catch (err) {
    next(err);
  }
});

router.post('/AddOriginServer', async (req, res, next) => {
  try {
    const {email, wallet, serverName, host} = req.body;
    const server = await sentry.AddOriginServer(email, wallet, serverName, host);
    res.json(server);
  } catch (err) {
    next(err);
  }
});

router.post('/AddEndpoint', async (req, res, next) => {
  try {
    const {email, wallet, originServerId, path, verb} = req.body;
    const endpoint = await sentry.AddEndpoint(email, wallet, originServerId, path, verb);
    res.json(endpoint);
  } catch (err) {
    next(err);
  }
});

router.post('/AddEndpointAccessGrant', async (req, res, next) => {
  try {
    const {email, wallet, endpointId, clientEmail} = req.body;
    const eag = await sentry.AddEndpointAccessGrant(email, wallet, endpointId, clientEmail);
    res.json(eag);
  } catch (err) {
    next(err);
  }
});

router.post('/GetEndpointAccessGrant', async (req, res, next) => {
  try {
    const {email, wallet, endpointAccessGrantId} = req.body;
    const eag = await sentry.GetEndpointAccessGrant(email, wallet, endpointAccessGrantId);
    res.json(eag);
  } catch (err) {
    next(err);
  }
});

router.post('/ClientHomepageData', async (req, res, next) => {
  try {
    const {email, wallet} = req.body;
    const result = await sentry.ClientHomepageData(email, wallet);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

router.post('/Approve', async (req, res, next) => {
  try {
    const {email, wallet, endpointAccessGrantId} = req.body;
    const eag = await sentry.Approve(email, wallet, endpointAccessGrantId);
    res.json(eag);
  } catch (err) {
    next(err);
  }
});

router.post('/Revoke', async (req, res, next) => {
  try {
    const { email, wallet, endpointAccessGrantId } = req.body;
    const eag = await sentry.Revoke(email, wallet, endpointAccessGrantId);
    res.json(eag);
  } catch (err) {
    next(err);
  }
});

router.post('/Enable', async (req, res, next) => {
  try {
    const {email, wallet, endpointAccessGrantId} = req.body;
    const eag = await sentry.Enable(email, wallet, endpointAccessGrantId);
    res.json(eag);
  } catch (err) {
    next(err);
  }
});

// Error handling middleware
router.use(function (err, req, res) {
  if (err.statusCode) {
    res.status(err.statusCode).send(err.message);
  } else {
    res.status(500).send(err);
  }
});

module.exports = router;
