const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const proxy = require('express-http-proxy');
const { prettyJSONString } = require('../utils');

const contract = require(`${__dirname}/contract`);

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.get('/ping', async (req, res) => {
  try {
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.use('/proxy', proxy('localhost:9998'));

app.use('/protected', proxy('localhost:9998', {
  proxyReqOptDecorator: async function(proxyReqOpts, srcReq) {
    console.log(srcReq.path);
    // await contract.ping(srcReq.body.email, srcReq.body.wallet);
    // return Promise.reject('An arbitrary rejection message.');
    return proxyReqOpts;
  }
}));

app.post('/enroll', async (req, res) => {
  try {
    const walletContent = await contract.enroll(req.body.email, req.body.secret);
    res.json({ walletContent });
  } catch (err) {
    // next(err);
    console.log(prettyJSONString(JSON.stringify(err)));
    res.status(500).send(err);
  }
});

app.post('/login', async (req, res) => {
  try {
    const walletContent = await contract.login(req.body.email, req.body.wallet, req.body.timestamp, req.body.location);
    res.json({ walletContent });
  } catch (err) {
    // next(err);
    console.log(prettyJSONString(JSON.stringify(err)));
    res.status(500).send(err);
  }
});

app.post('/addendpoint', async (req, res) => {
  try {
    await contract.addEndpoint(req.body.email, req.body.wallet, req.body.path);
    res.sendStatus(200);
  } catch (err) {
    // next(err);
    console.log(prettyJSONString(JSON.stringify(err)));
    res.status(500).send(err);
  }
});

app.post('/addmapping', async (req, res) => {
  try {
    await contract.addMapping(req.body.email, req.body.wallet, req.body.path);
    res.status(200).send();
  } catch (err) {
    // next(err);
    console.log(prettyJSONString(JSON.stringify(err)));
    res.status(500).send(err);
  }
});

app.post('/forward', async (req, res) => {
  try {
    const authorized = await contract.forward(req.body.email, req.body.wallet, req.body.path);
    res.json({ authorized });
  } catch (err) {
    // next(err);
    console.log(prettyJSONString(JSON.stringify(err)));
    res.status(500).send(err);
  }
});

app.post('/fetchall', async (req, res) => {
  try {
    const assets = await contract.fetchall(req.body.email, req.body.wallet);
    res.json({ assets });
  } catch (err) {
    // next(err);
    console.log(prettyJSONString(JSON.stringify(err)));
    res.status(500).send(err);
  }
});

app.post('/history', async (req, res) => {
  try {
    const accessors = await contract.traverseHistory(req.body.email, req.body.wallet, req.body.assetKey);
    res.json(accessors);
  } catch (err) {
    console.log(prettyJSONString(JSON.stringify(err)));
    res.status(500).send(err);
  }
});

module.exports = app;
