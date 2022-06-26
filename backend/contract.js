'use strict';

const { Gateway, Wallets } = require('fabric-network');
const fabprotos = require('fabric-protos');
const { BlockDecoder } = require('fabric-common');
const ACTIONS =  require('./actions.json');
const { caClient, prettyJSONString, parseOrgFromEmail, getConnectionProfile } = require('../utils');
const fs = require('fs');
const userWalletCreated = user => fs.existsSync(`./wallet/${user}.id`);

const MSP = orgNo => `Org${orgNo}MSP`;
const CA_HOST = orgNo => `ca.org${orgNo}.example.com`;
const WALLET_PATH = orgNo => `./wallet${orgNo}` ;
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
  const orgNo = parseOrgFromEmail(email);
  const wallet = await Wallets.newFileSystemWallet(WALLET_PATH(orgNo));
  const walletContent = await enrollCa(email, wallet, secret);
  await executeContract([], wallet, ACTIONS.ADD_USER, email, email);
  return walletContent;
};

exports.getUser = async (email, walletContent) => JSON.parse(await executeContract(PEERS, await inMemWallet(email, walletContent),
  ACTIONS.GET_USER, email, email));

exports.addRead = async (email, walletContent, timestamp, readVal) => JSON.parse(await executeContract(PEERS, await inMemWallet(email, walletContent),
  ACTIONS.ADD_READ, email, email, timestamp, readVal));

exports.getReads = async (email, walletContent) => JSON.parse(await executeContract(PEERS, await inMemWallet(email, walletContent),
  ACTIONS.GET_READS, email, email));

exports.traverseHistory = async (email, walletContent, assetKey) => JSON.parse(await getHistory(PEERS, await inMemWallet(email, walletContent),
  ACTIONS.TRAVERSE_HISTORY, email, assetKey));

async function inMemWallet(email, walletContent) {
  const wallet = await Wallets.newInMemoryWallet();
  wallet.put(email, walletContent);
  return wallet;
}

async function getHistory(endorsingPeers, wallet, action, identity, ...args) {
  const peer = getConnectionProfile(parseOrgFromEmail(identity));
  const gateway = new Gateway();
  try {
    debugger;
    await gateway.connect(peer, {
      wallet,
      identity,
      discovery: { enabled: true, asLocalhost: true }
    });    
    const network = await gateway.getNetwork(CHANNEL);
    const contract = network.getContract('qscc');
    const resultByte = await contract.evaluateTransaction(
      'GetChainInfo',
      CHANNEL
    );
    const resultJson = await fabprotos.common.BlockchainInfo.decode(resultByte);
    console.log('queryChainInfo',JSON.parse(JSON.stringify(resultJson)).height);
    let height = parseInt(JSON.parse(JSON.stringify(resultJson)).height);

    const ress = [];
    for(let i = 0 ; i < height ; i++) {

      if (i === 9) {
        debugger;
      }
      
      const result = await contract.evaluateTransaction('GetBlockByNumber', CHANNEL, i);
      const block = BlockDecoder.decode(result);
      // ress.push(block);
      const rw = processBlock(block);
      ress.push(rw);
    }

    // console.log(JSON.stringify(ress));
    console.log(JSON.stringify(ress));
    debugger;

    // const result = await contract
    //   .createTransaction(action)
    //   // .setEndorsingPeers(endorsingPeers)
    //   .submit(...args);
    // debugger;
    // return prettyJSONString(result.toString());
  }
  finally {
    gateway.disconnect();
  }
}

// based on 
// - https://github.com/renjithpta/demo-3org-fabric/blob/2f8eb71593d7455aa70e9afb88ca4e6b75f12216/apiserver/app/cscc.js
// - hyperledger explorer:  async processBlockEvent(client, block, noDiscovery) 
function processBlock(block) {
  const txLen = block.data.data.length;
  const res = [];
  for (let txIndex = 0; txIndex < txLen; txIndex++) {
    const txObj = block.data.data[txIndex];
    const creator = txObj.payload.header.signature_header.creator;
    let rwset;
    let readSet;
    let writeSet;

    if (txObj.payload.data.actions !== undefined) {
      rwset = txObj.payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset;
      readSet = rwset.map(rw => ({
        chaincode: rw.namespace,
        set: rw.rwset.reads
      }));
      writeSet = rwset.map(rw => ({
        chaincode: rw.namespace,
        set: rw.rwset.writes
      }));
    }

    // const read_set = JSON.stringify(readSet, null, 2);
    // const write_set = JSON.stringify(writeSet, null, 2);

    res.push({
      readSet
    });
  }

  return res;
}

async function executeContract(endorsingPeers, wallet, action, identity, ...args) {
  const peer = getConnectionProfile(parseOrgFromEmail(identity));
  const gateway = new Gateway();
  try {
    await gateway.connect(peer, {
      wallet,
      identity,
      discovery: { enabled: true, asLocalhost: true }
    });    
    const network = await gateway.getNetwork(CHANNEL);
    const contract = network.getContract(CHAINCODE);
    const result = await contract
      .createTransaction(action)
      // .setEndorsingPeers(endorsingPeers)
      .submit(...args);
    return prettyJSONString(result.toString());
  }
  finally {
    gateway.disconnect();
  }
}

async function enrollCa(email, wallet, secret) {
  if (userWalletCreated(email) || (await wallet.get(email))) { return; }
  const orgNo = parseOrgFromEmail(email);
  const peer = getConnectionProfile(orgNo);
  const ca = caClient(peer, CA_HOST(orgNo));
  const enrollment = await ca.enroll({
    enrollmentID: email,
    enrollmentSecret: secret
  });
  const walletContent = {
    credentials: {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
    },
    mspId: MSP(orgNo),
    type: 'X.509',
  };
  await wallet.put(email, walletContent);
  return walletContent;
}

