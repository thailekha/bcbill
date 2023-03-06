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
    const walletContent = await sentry.registerUser(req.body.email);
    res.json({ walletContent });
  } catch (err) {
    next(err);
  }
});

app.post('/enroll', async (req, res, next) => {
  try {
    const walletContent = await sentry.enroll(req.body.email, req.body.secret);
    res.json({ walletContent });
  } catch (err) {
    next(err);
  }
});

app.post('/login', async (req, res, next) => {
  try {
    const walletContent = await sentry.login(req.body.email, req.body.wallet, req.body.timestamp);
    res.json({ walletContent });
  } catch (err) {
    next(err);
  }
});

// Proxy endpoints
app.use('/proxy', proxy('localhost:9998'));

app.use('/protected', proxy('localhost:9998', {
  proxyReqOptDecorator: async function(proxyReqOpts, srcReq) {
    const {email, wallet} = JSON.parse(srcReq.headers.auth);
    const authorized = await sentry.forward(email, wallet, srcReq.path);
    return authorized ? proxyReqOpts : Promise.reject('Unauthorized');
  }
}));

// Chaincode endpoints
app.post('/pingcontract', async (req, res, next) => {
  try {
    const pong = await sentry.ping(req.body.email, req.body.wallet, req.body.text);
    res.json({ pong });
  } catch (err) {
    next(err);
  }
});

app.post('/addendpoint', async (req, res, next) => {
  try {
    await sentry.addEndpoint(req.body.email, req.body.wallet, req.body.path);
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});

app.post('/addmapping', async (req, res, next) => {
  try {
    await sentry.addMapping(req.body.email, req.body.wallet, req.body.path);
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});

app.post('/forward', async (req, res, next) => {
  try {
    const authorized = await sentry.forward(req.body.email, req.body.wallet, req.body.path);
    res.json({ authorized });
  } catch (err) {
    next(err);
  }
});

app.post('/fetchall', async (req, res, next) => {
  try {
    const assets = await sentry.fetchall(req.body.email, req.body.wallet);
    res.json({ assets });
  } catch (err) {
    next(err);
  }
});

app.post('/revoke', async (req, res, next) => {
  try {
    await sentry.revoke(req.body.email, req.body.wallet, req.body.clientCertHash, req.body.path);
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});

app.post('/reenable', async (req, res, next) => {
  try {
    await sentry.reenable(req.body.email, req.body.wallet, req.body.clientCertHash, req.body.path);
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});

app.post('/history', async (req, res, next) => {
  try {
    const accessors = await sentry.traverseHistory(req.body.email, req.body.wallet, req.body.assetKey);
    res.json(accessors);
  } catch (err) {
    next(err);
  }
});

// Error handling middleware
app.use(function (err, req, res, next) {
  console.error(prettyJSONString(JSON.stringify(err)));
  res.status(500).send(err);
});

module.exports = app;

