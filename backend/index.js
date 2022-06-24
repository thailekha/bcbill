const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { prettyJSONString } = require('../utils');

const contract = require('./contract');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.post('/enroll', async (req, res) => {
  try {
    debugger
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
    const user = await user.getUser(req.body.email, req.body.wallet);
    res.json(user);
  } catch (err) {
    console.log(prettyJSONString(JSON.stringify(err)));
    res.status(500).send(err);
  }
});

app.post('/addread', async (req, res) => {
  try {
    console.log(req.body.email, req.body.wallet, req.body.timestamp, req.body.readVal);
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
    console.log(reads);
    res.json(reads);
  } catch (err) {
    console.log(prettyJSONString(JSON.stringify(err)));
    res.status(500).send(err);
  }
});

app.post('/history', async (req, res) => {
  try {
    const result = await contract.traverseHistory(req.body.email, req.body.wallet, req.body.assetKey);
    console.log(result);
    res.json(result);
  } catch (err) {
    console.log(prettyJSONString(JSON.stringify(err)));
    res.status(500).send(err);
  }
});

app.listen(9999);
console.log('started');

// async function test() {
//   try {
//     await user.enroll('customer1@gmail.com', 'dEvrDyiyCHia');
//   } catch (err) {
//     console.log(prettyJSONString(JSON.stringify(err)));
//   }
// }

// test();
