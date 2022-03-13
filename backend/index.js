const express = require('express');

const app = express();

app.get('/', function(req, res){
  res.send("Hello world!");
});

app.listen(4000);

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('./CAUtil.js');
const { buildCCPOrg1, buildWallet, adminAndUserCreated } = require('./AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'chaincode1';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser';

const prettyJSONString = (inputString) => JSON.stringify(JSON.parse(inputString), null, 2);
const userWalletCreated = () => fs.existsSync('./wallet/user.id');

// Enroll with the CA first
// then register with the contract 
async function register(caClient, wallet) {
  await enrollAdmin(caClient, wallet, mspOrg1);
  await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');
}

async function main() {
  try {
    const peer = buildCCPOrg1();
    const caClient = buildCAClient(FabricCAServices, peer, 'ca.org1.example.com');
    const wallet = await buildWallet(Wallets, walletPath);

    if (!userWalletCreated()) {
      await adminAndUser(caClient, wallet);
    }

    const gateway = new Gateway();

    try {
      await gateway.connect(peer, {
        wallet,
        identity: org1UserId,
        discovery: { enabled: true, asLocalhost: true }
      });

      const network = await gateway.getNetwork(channelName);
      const contract = network.getContract(chaincodeName);
      await contract.submitTransaction('InitLedger');
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error(`******** FAILED to run the application: ${error}`);
  }
}
