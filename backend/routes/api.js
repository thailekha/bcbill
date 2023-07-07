const router = require('express').Router();
const sentry = require('../services/sentry');
const url = require('url');
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();

router.post('/register', async (req, res, next) => {
  try {
    const {entityID, isProvider} = req.body;
    const walletContent = await sentry.registerUser(entityID, isProvider === true || isProvider === 'on');
    res.json({ walletContent });
  } catch (err) {
    next(err);
  }
});

router.all('/origin-server-no-fabric/*', async (req, res, next) => {
  try {
    const {target} = req.headers;
    const { pathname, search } = url.parse(req.url);
    const endpointPath = pathname.split('/').slice(2).join('/'); // extract everything after '/origin-server-no-fabric/'

    req.url = `${endpointPath}${search || ''}`;
    proxy.web(req, res, { target, changeOrigin: true }, (error) => {
      // Handle errors that occur when forwarding the request
      console.error(`Error forwarding request: ${error}`);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`An error occurred: ${error}`);
    });
  } catch (err) {
    next(err);
  }
});

function forwardToOriginHandler(limited) {
  return (async function forwardToOrigin(req, res, next) {
    try {
      const { pathname, search } = url.parse(req.url, true);
      const { entityID, wallet, endpointAccessGrantId } = JSON.parse(req.headers.auth);
      const originServerInfo = limited ? await sentry.GetOriginServerInfoLimited(entityID, wallet, endpointAccessGrantId) : await sentry.GetOriginServerInfo(entityID, wallet, endpointAccessGrantId);
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
}

router.all('/origin-server/*', forwardToOriginHandler(true));

router.all('/origin-server-unlimited/*', forwardToOriginHandler(false));

router.post('/GetUser', async (req, res, next) => {
  try {
    const {entityID, wallet} = req.body;
    const user = await sentry.GetUser(entityID, wallet);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.post('/AddOriginServer', async (req, res, next) => {
  try {
    const {entityID, wallet, serverName, host} = req.body;
    const server = await sentry.AddOriginServer(entityID, wallet, serverName, host);
    res.json(server);
  } catch (err) {
    next(err);
  }
});

router.post('/AddEndpoint', async (req, res, next) => {
  try {
    const {entityID, wallet, originServerId, path, verb} = req.body;
    const endpoint = await sentry.AddEndpoint(entityID, wallet, originServerId, path, verb.toUpperCase());
    res.json(endpoint);
  } catch (err) {
    next(err);
  }
});

router.post('/AddEndpointAccessGrant', async (req, res, next) => {
  try {
    const {entityID, wallet, endpointId} = req.body;
    const eag = await sentry.AddEndpointAccessGrant(entityID, wallet, endpointId);
    res.json(eag);
  } catch (err) {
    next(err);
  }
});

router.post('/GetEndpointAccessGrant', async (req, res, next) => {
  try {
    const {entityID, wallet, endpointAccessGrantId} = req.body;
    const eag = await sentry.GetEndpointAccessGrant(entityID, wallet, endpointAccessGrantId);
    res.json(eag);
  } catch (err) {
    next(err);
  }
});

router.post('/ShareAccess', async (req, res, next) => {
  try {
    const {entityID, wallet, endpointAccessGrantId, otherClientEntityID} = req.body;
    const eag = await sentry.ShareAccess(entityID, wallet, endpointAccessGrantId, otherClientEntityID);
    res.json(eag);
  } catch (err) {
    next(err);
  }
});

router.post('/ApiProviderHomepageData', async (req, res, next) => {
  try {
    const {entityID, wallet} = req.body;
    const result = await sentry.ApiProviderHomepageData(entityID, wallet);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/ClientHomepageData', async (req, res, next) => {
  try {
    const {entityID, wallet} = req.body;
    const result = await sentry.ClientHomepageData(entityID, wallet);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/Approve', async (req, res, next) => {
  try {
    const {entityID, wallet, endpointAccessGrantId} = req.body;
    const eag = await sentry.Approve(entityID, wallet, endpointAccessGrantId);
    res.json(eag);
  } catch (err) {
    next(err);
  }
});

router.post('/Revoke', async (req, res, next) => {
  try {
    const { entityID, wallet, endpointAccessGrantId } = req.body;
    const eag = await sentry.Revoke(entityID, wallet, endpointAccessGrantId);
    res.json(eag);
  } catch (err) {
    next(err);
  }
});

router.post('/Enable', async (req, res, next) => {
  try {
    const {entityID, wallet, endpointAccessGrantId} = req.body;
    const eag = await sentry.Enable(entityID, wallet, endpointAccessGrantId);
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
