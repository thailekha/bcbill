'use strict';

const { Gateway, Wallets } = require('fabric-network');
const fabprotos = require('fabric-protos');
const { BlockDecoder } = require('fabric-common');
const ACTIONS =  require(`${__dirname}/actions.json`);
const { caClient, prettyJSONString, parseOrgFromEmail, getConnectionProfile } = require('../utils');
const fs = require('fs');
const hash = require('object-hash');
const userWalletCreated = user => fs.existsSync(`${__dirname}/wallet/${user}.id`);

const MSP = orgNo => `Org${orgNo}MSP`;
const CA_HOST = orgNo => `ca.org${orgNo}.example.com`;
const WALLET_PATH = orgNo => `${__dirname}/wallet${orgNo}` ;
// const AFFILIATION = 'org1.department1';

const CHANNEL = 'mychannel';
const CHAINCODE = 'chaincode1';
const PEERS = [
  'peer0.org1.example.com',
  'peer0.org2.example.com',
  'peer0.org3.example.com',
];

const secrets = require(`${__dirname}/../admin/secrets.json`);

exports.enroll = async (email, secret) => {
  if (secret !== secrets[email]) {
    throw new Error('invalid secret');
  }
  const orgNo = parseOrgFromEmail(email);
  const wallet = await Wallets.newFileSystemWallet(WALLET_PATH(orgNo));
  const walletContent = await enrollCa(email, wallet, secret);
  await executeContract(email, walletContent, ACTIONS.ADD_USER, email, hash(walletContent.credentials.certificate));
  return walletContent;
};

exports.getUser = async (requestorEmail, walletContent, certHash) => await executeContract(
  requestorEmail, walletContent, ACTIONS.GET_USER, certHash);

exports.addRead = async (email, walletContent, timestamp, readVal) => await executeContract(
  email, walletContent, ACTIONS.ADD_READ, hash(walletContent.credentials.certificate), timestamp, readVal);

exports.getReads = async (email, walletContent, certHash) => await executeContract(
  email, walletContent, ACTIONS.GET_READS, certHash);

exports.traverseHistory = async (email, walletContent, assetKey) => await getHistory(
  email, walletContent, hash(walletContent.credentials.certificate), assetKey);

async function inMemWallet(email, walletContent) {
  const wallet = await Wallets.newInMemoryWallet();
  wallet.put(email, walletContent);
  return wallet;
}

async function getHistory(identity, walletContent, certHash, assetToCheck) {
  const peer = getConnectionProfile(parseOrgFromEmail(identity));
  const wallet = await inMemWallet(identity, walletContent);
  const gateway = new Gateway();
  try {
    await gateway.connect(peer, {
      wallet,
      identity,
      discovery: { enabled: true, asLocalhost: true }
    });    
    const network = await gateway.getNetwork(CHANNEL);
    const qsccContract = network.getContract('qscc');
    const resultByte = await qsccContract.evaluateTransaction(
      'GetChainInfo',
      CHANNEL
    );
    const resultJson = await fabprotos.common.BlockchainInfo.decode(resultByte);
    let height = parseInt(JSON.parse(JSON.stringify(resultJson)).height);

    const accesses = {};
    for(let i = 0 ; i < height ; i++) {
    // for(let i = height - 1 ; i >= 0 ; i--) {
      const result = await qsccContract.evaluateTransaction('GetBlockByNumber', CHANNEL, i);
      const block = BlockDecoder.decode(result);
      processBlock(block, assetToCheck, certHash, accesses);
    }

    const accessors = {};
    const hashes = Object.keys(accesses);

    if (hashes.length === 0) {
      return {};
    }

    const bcbillContract = network.getContract(CHAINCODE);
    for(let i = 0; i < hashes.length; i++) {
      const user = JSON.parse(((await bcbillContract.evaluateTransaction(ACTIONS.GET_USER, hashes[i])).toString()));
      accessors[user.email] = accesses[hashes[i]];
    }
    
    return accessors;
  } finally {
    gateway.disconnect();
  }
}

// based on 
// - https://github.com/renjithpta/demo-3org-fabric/blob/2f8eb71593d7455aa70e9afb88ca4e6b75f12216/apiserver/app/cscc.js
// - hyperledger explorer:  async processBlockEvent(client, block, noDiscovery)
function processBlock(block, assetToCheck, ownerIdHash, accessors) {
  const txLen = block.data.data.length;
  const timestamp = block.data.data[0].payload.header.channel_header.timestamp;
  for (let txIndex = 0; txIndex < txLen; txIndex++) {
    const txObj = block.data.data[txIndex];
    if (txObj.payload.data.actions !== undefined) {
      const rwsetArray = txObj.payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset;
      const creatorIdHash = hash(txObj.payload.header.signature_header.creator.id_bytes.toString());
      const readAssets = rwsetArray.map(rw => rw.rwset.reads.map(r => r.key)).flat();
      // const writeSet = rwsetArray.map(rw => ({
      //   set: rw.rwset.writes
      // }));
      // if (readSet.length > 1 && readSet[1].set.length > 0)
      if (creatorIdHash !== ownerIdHash && readAssets.includes(assetToCheck)) {
        console.log('Found access at block', block.header.number.low);
        if (accessors[creatorIdHash]) {
          accessors[creatorIdHash].push(timestamp);
        } else {
          // do NOT use Set, for some reasons the set contents dissapear on response
          accessors[creatorIdHash] = [timestamp];
        }
      }
    }
  }
}

async function executeContract(identity, walletContent, action, ...args) {
  const peer = getConnectionProfile(parseOrgFromEmail(identity));
  const wallet = await inMemWallet(identity, walletContent);
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

    // result is a buffer, gotta call toString then parse
    return JSON.parse((result.toString()));
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

