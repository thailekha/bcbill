'use strict';

const { Gateway, Wallets } = require('fabric-network');
const ACTIONS =  require('./actions.json');
const { connectionProfileOrg1, caClient, prettyJSONString } = require('../utils');
const fs = require('fs');
const userWalletCreated = user => fs.existsSync(`./wallet/${user}.id`);

const MSP = 'Org1MSP';
const WALLET_PATH = require('path').join(__dirname, 'wallet');
const CA_HOST = 'ca.org1.example.com';
// const AFFILIATION = 'org1.department1';
const CHANNEL = 'mychannel';
const CHAINCODE = 'chaincode1';
const PEERS = [
  'peer0.org1.example.com',
  'peer0.org2.example.com',
  'peer0.org3.example.com',
];

const secrets = require('../admin/secrets.json');

exports.enroll = async (email, secret) => {
  if (secret !== secrets[email]) {
    throw new Error('invalid secret');
  }
  const wallet = await Wallets.newFileSystemWallet(WALLET_PATH);
  const walletContent = await enrollCa(email, wallet, secret);
  await executeContract([], wallet, ACTIONS.ADD_USER, email);
  return walletContent;
};

exports.getUser = async (email, walletContent) => JSON.parse(await executeContract(PEERS, await inMemWallet(email, walletContent),
  ACTIONS.GET_USER, email));

exports.addRead = async (email, walletContent, timestamp, readVal) => JSON.parse(await executeContract(PEERS, await inMemWallet(email, walletContent),
  ACTIONS.ADD_READ, email, timestamp, readVal));

exports.getReads = async (email, walletContent) => JSON.parse(await executeContract(PEERS, await inMemWallet(email, walletContent),
  ACTIONS.GET_READS, email));

async function inMemWallet(email, walletContent) {
  const wallet = await Wallets.newInMemoryWallet();
  wallet.put(email, walletContent);
  return wallet;
}

async function executeContract(endorsingPeers, wallet, action, identity, ...args) {
  const peer = connectionProfileOrg1();
  const gateway = new Gateway();
  try {
    await gateway.connect(peer, {
      wallet,
      identity,
      discovery: { enabled: true, asLocalhost: true }
    });    
    const network = await gateway.getNetwork(CHANNEL);
    const contract = network.getContract(CHAINCODE);
    // debugger;
    const result = await contract
      .createTransaction(action)
      // .setEndorsingPeers(endorsingPeers)
      .submit(...(args.length === 0 ? [identity] : [identity, ...args]));
    return prettyJSONString(result.toString());
  }
  finally {
    gateway.disconnect();
  }
}

async function enrollCa(email, wallet, secret) {
  if (userWalletCreated(email) || (await wallet.get(email))) { return; }
  const peer = connectionProfileOrg1();
  const ca = caClient(peer, CA_HOST);
  const enrollment = await ca.enroll({
    enrollmentID: email,
    enrollmentSecret: secret
  });
  const walletContent = {
    credentials: {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
    },
    mspId: MSP,
    type: 'X.509',
  };
  await wallet.put(email, walletContent);
  return walletContent;
}
