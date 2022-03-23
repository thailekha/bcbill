'use strict';

const { Gateway, Wallets } = require('fabric-network');
const { connectionProfileOrg1, caClient, prettyJSONString } = require('../utils');
const fs = require('fs');
const userWalletCreated = user => fs.existsSync(`./wallet/${user}.id`);

const MSP = 'Org1MSP';
const WALLET_PATH = require('path').join(__dirname, 'wallet');
const CA_HOST = 'ca.org1.example.com';
// const AFFILIATION = 'org1.department1';
const CHANNEL = 'mychannel';
const CHAINCODE = 'chaincode1';

const secrets = require('../admin/secrets.json');

let wallet;
let peer;
let ca;

async function init() {
  // Note: wallet can be built in memory as well
  wallet = await Wallets.newFileSystemWallet(WALLET_PATH);
  peer = connectionProfileOrg1();
  ca = caClient(peer, CA_HOST);
}

exports.enroll = async (email, secret) => {
  if (secret !== secrets[email]) {
    throw new Error('invalid secret');
  }
  await init();
  await enrollCa(email, secret);
  await enrollContract(email);
};

async function enrollCa(email, secret) {
  if (userWalletCreated(email) || (await wallet.get(email))) { return; }
  const enrollment = await ca.enroll({
    enrollmentID: email,
    enrollmentSecret: secret
  });
  await wallet.put(email, {
    credentials: {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
    },
    mspId: MSP,
    type: 'X.509',
  });
}

async function enrollContract(email) {
  const gateway = new Gateway();
  try {
    await gateway.connect(peer, {
      wallet,
      identity: email,
      discovery: { enabled: true, asLocalhost: true }
    });
    const network = await gateway.getNetwork(CHANNEL);
    const contract = network.getContract(CHAINCODE);
    const result = await contract.submitTransaction('CreateUser', email, email);
    console.log(`*** Result: ${prettyJSONString(result.toString())}`);
  }
  finally {
    gateway.disconnect();
  }
}
