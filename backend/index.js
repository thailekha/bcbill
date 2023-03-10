const express = require('express');
const bodyParser = require('body-parser');
const url = require('url');
const cors = require('cors');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer();

const { prettyJSONString } = require(`${__dirname}/../utils`);

const sentry = require(`${__dirname}/sentry`);

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// Ping endpoint
app.get('/ping', async (req, res) => {
  res.sendStatus(200);
});

// User endpoints
app.post('/register', async (req, res, next) => {
  try {
    const {email, isProvider} = req.body;
    const walletContent = await sentry.registerUser(email, isProvider);
    res.json({ walletContent });
  } catch (err) {
    next(err);
  }
});

// have an origin server that download and sends back a random image from giphy

app.all('/origin-server/*', async (req, res, next) => {
  try {
    const { pathname, search } = url.parse(req.url, true);
    const { email, wallet, endpointAccessGrantId } = JSON.parse(req.headers.auth);
    const originServerInfo = await sentry.GetOriginServerInfo(email, wallet, endpointAccessGrantId);
    if (!originServerInfo) {
      return Promise.reject('Unauthorized');
    }
    const { host: originServerHost, path: authorizedPath, verb: authorizedVerb } = originServerInfo;
    const [originServerName, ...endpointPath] = pathname.slice('/origin-server/'.length).split('/');
    const finalAuthorizedCheck = authorizedPath === endpointPath.join('/') && authorizedVerb.toUpperCase() === req.method;

    if (!finalAuthorizedCheck) {
      return Promise.reject('Unauthorized');
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

app.post('/AddOriginServer', async (req, res, next) => {
  try {
    const {email, wallet, serverName, host} = req.body;
    const server = await sentry.AddOriginServer(email, wallet, serverName, host);
    res.json(server);
  } catch (err) {
    next(err);
  }
});

app.post('/AddEndpoint', async (req, res, next) => {
  try {
    const {email, wallet, originServerId, path, verb} = req.body;
    const endpoint = await sentry.AddEndpoint(email, wallet, originServerId, path, verb);
    res.json(endpoint);
  } catch (err) {
    next(err);
  }
});

app.post('/AddEndpointAccessGrant', async (req, res, next) => {
  try {
    const {email, wallet, endpointId, clientEmail} = req.body;
    const eag = await sentry.AddEndpointAccessGrant(email, wallet, endpointId, clientEmail);
    res.json(eag);
  } catch (err) {
    next(err);
  }
});

app.post('/GetEndpointAccessGrant', async (req, res, next) => {
  try {
    const {email, wallet, endpointAccessGrantId} = req.body;
    const eag = await sentry.GetEndpointAccessGrant(email, wallet, endpointAccessGrantId);
    res.json(eag);
  } catch (err) {
    next(err);
  }
});

app.post('/FetchAll', async (req, res, next) => {
  try {
    const {email, wallet, providerEmail} = req.body;
    const result = await sentry.FetchAll(email, wallet, providerEmail);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

app.post('/Approve', async (req, res, next) => {
  try {
    const {email, wallet, endpointAccessGrantId} = req.body;
    const eag = await sentry.Approve(email, wallet, endpointAccessGrantId);
    res.json(eag);
  } catch (err) {
    next(err);
  }
});

app.post('/Revoke', async (req, res, next) => {
  try {
    const {email, wallet, endpointAccessGrantId} = req.body;
    await sentry.Revoke(email, wallet, endpointAccessGrantId);
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});

app.post('/Enable', async (req, res, next) => {
  try {
    const {email, wallet, endpointAccessGrantId} = req.body;
    await sentry.Enable(email, wallet, endpointAccessGrantId);
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});

// Error handling middleware
app.use(function (err, req, res) {
  console.error(prettyJSONString(JSON.stringify(err)));
  res.status(500).send(err);
});

module.exports = app;

