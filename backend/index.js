const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const proxy = require('express-http-proxy');
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

app.post('/AddOriginServer', async (req, res, next) => {
  try {
    const {email, wallet, host} = req.body;
    await sentry.AddOriginServer(email, wallet, host);
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});

app.post('/AddEndpoint', async (req, res, next) => {
  try {
    const {email, wallet, host, path, verb} = req.body;
    await sentry.AddEndpoint(email, wallet, host, path, verb);
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});

app.post('/AddEndpointAccessGrant', async (req, res, next) => {
  try {
    const {email, wallet, providerEmail, host, path, verb, clientEmail} = req.body;
    await sentry.AddEndpointAccessGrant(email, wallet, providerEmail, host, path, verb, clientEmail);
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});

app.post('/FetchAll', async (req, res, next) => {
  try {
    const {email, wallet, providerEmail} = req.body;
    const result = await sentry.FetchAll(email, wallet, providerEmail);
    res.json(result);
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

app.use('/protected', proxy('localhost:9998', {
  proxyReqOptDecorator: async function(proxyReqOpts, srcReq) {
    const {email, wallet} = JSON.parse(srcReq.headers.auth);
    const authorized = await sentry.forward(email, wallet, srcReq.path);
    return authorized ? proxyReqOpts : Promise.reject('Unauthorized');
  }
}));

// Error handling middleware
app.use(function (err, req, res) {
  console.error(prettyJSONString(JSON.stringify(err)));
  res.status(500).send(err);
});

module.exports = app;

