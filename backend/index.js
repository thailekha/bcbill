const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const proxy = require('express-http-proxy');
const { prettyJSONString } = require('../utils');

const contract = require(`${__dirname}/contract`);
const {Wallets} = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");

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

// Create a new fabric wallet for the API provider
app.post('/api/provider/wallet', async (req, res) => {
  try {
    const providerWallet = await Wallets.newInMemoryWallet();
    const providerUsername = req.body.username;

    const ca = new FabricCAServices('http://localhost:7040', { verify: false }, "ca.org1.example.com");

    // Enroll the API provider as an affiliate and import their identity into the in-memory wallet
    const enrollment = await ca.enroll({
      enrollmentID: providerUsername,
      enrollmentSecret: 'adminpw',
      attrs: [
        { name: 'affiliation', value: 'org1.department1' },
      ],
    });
    const providerX509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: 'Org1MSP',
      type: 'X.509',
    };
    await providerWallet.put(providerUsername, providerX509Identity);

    // Get the API provider's wallet content and return it to the client
    // const providerWalletContent = await providerWallet.export(providerUsername);
    res.status(201).send({
      wallet: JSON.stringify(providerWallet)
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating wallet.');
  }
});

app.use('/proxy', proxy('localhost:9998'));

app.use('/protected', proxy('localhost:9998', {
  proxyReqOptDecorator: async function(proxyReqOpts, srcReq) {
    const {email, wallet} = JSON.parse(srcReq.headers.auth);
    const authorized = await contract.forward(email, wallet, srcReq.path);
    return authorized ? proxyReqOpts : Promise.reject('Unauthorized');
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
    const walletContent = await contract.login(req.body.email, req.body.wallet, req.body.timestamp);
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

app.post('/revoke', async (req, res) => {
  try {
    await contract.revoke(req.body.email, req.body.wallet, req.body.clientCertHash, req.body.path);
    res.status(200).send();
  } catch (err) {
    // next(err);
    console.log(prettyJSONString(JSON.stringify(err)));
    res.status(500).send(err);
  }
});

app.post('/reenable', async (req, res) => {
  try {
    await contract.reenable(req.body.email, req.body.wallet, req.body.clientCertHash, req.body.path);
    res.status(200).send();
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
