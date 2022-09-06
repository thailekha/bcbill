const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
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

app.post('/getuser', async (req, res) => {
  try {
    const user = await contract.getUser(req.body.email, req.body.wallet);
    res.json(user);
  } catch (err) {
    console.log(prettyJSONString(JSON.stringify(err)));
    res.status(500).send(err);
  }
});

app.post('/addread', async (req, res) => {
  try {
    const read = await contract.addRead(req.body.email, req.body.wallet, req.body.timestamp, req.body.readVal);
    res.json(read);
  } catch (err) {
    console.log(prettyJSONString(JSON.stringify(err)));
    res.status(500).send(err);
  }
});

app.post('/getreads', async (req, res) => {
  try {
    const reads = await contract.getReads(req.body.email, req.body.wallet);
    reads.sort((a,b) => a.value.time - b.value.time);
    res.json({ reads });
  } catch (err) {
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
