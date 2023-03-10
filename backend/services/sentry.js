'use strict';

const { Gateway } = require('fabric-network');
const fabprotos = require('fabric-protos');
const { BlockDecoder } = require('fabric-common');
const ACTIONS =  require(`${__dirname}/actions`);
const { registerClient, inMemWallet, connectionProfile } = require(`../../utils`);
const hash = require('object-hash');
const moment = require('moment');

const CHANNEL = 'mychannel';
const CHAINCODE = 'chaincode1';

exports.registerUser = async (email, isProvider) => {
  const walletContent = await registerClient(email);
  await executeContract({}, email, walletContent, isProvider ? ACTIONS.AddProvider : ACTIONS.AddClient, email);
  return walletContent;
};

exports.AddOriginServer = async (email, walletContent, serverName, host) => await executeContract(
  {}, email, walletContent, ACTIONS.AddOriginServer, email, serverName, host);

exports.AddEndpoint = async (email, walletContent, originServerId, path, verb) => await executeContract(
  {}, email, walletContent, ACTIONS.AddEndpoint, originServerId, path, verb);

exports.AddEndpointAccessGrant = async (email, walletContent, endpointId, clientEmail) => await executeContract(
  {}, email, walletContent, ACTIONS.AddEndpointAccessGrant, endpointId, clientEmail);

exports.GetEndpointAccessGrant = async (email, walletContent, endpointAccessGrantId) => await executeContract(
  {fast: true}, email, walletContent, ACTIONS.GetEndpointAccessGrant, endpointAccessGrantId);

exports.Revoke = async (email, walletContent, endpointAccessGrantId) => await executeContract(
  {}, email, walletContent, ACTIONS.Revoke, endpointAccessGrantId);

exports.Enable = async (email, walletContent, endpointAccessGrantId) => await executeContract(
  {}, email, walletContent, ACTIONS.Enable, endpointAccessGrantId);

exports.GetOriginServerInfo = async (email, walletContent, endpointAccessGrantId) => await executeContract(
  {fast: true}, email, walletContent, ACTIONS.GetOriginServerInfo, endpointAccessGrantId);

exports.ClientHomepageData = async (email, walletContent) => await executeContract(
  {fast: true}, email, walletContent, ACTIONS.ClientHomepageData);

exports.Approve = async (email, walletContent, endpointAccessGrantId) => await executeContract(
  {}, email, walletContent, ACTIONS.Approve, endpointAccessGrantId);

exports.traverseHistory = async (email, walletContent, assetKey) => await getHistory(
  {}, email, walletContent, hash(walletContent.credentials.certificate), assetKey);

async function getHistory(identity, walletContent, certHash, assetToCheck) {
  const profile = connectionProfile();
  const wallet = await inMemWallet(identity, walletContent);
  const gateway = new Gateway();
  try {
    await gateway.connect(profile, {
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
      const timestamps = accesses[hashes[i]];

      for (const timestamp of timestamps) {
        const location = retrieveLocationOfAccess(user.logins, timestamp);
        //  does this override already existed entry?
        if (!accessors[user.email]) {
          accessors[user.email] = [{
            timestamp,
            location
          }];
        } else {
          accessors[user.email].push({
            timestamp,
            location
          });
        }           
      }
    }
    
    return accessors;
  } finally {
    gateway.disconnect();
  }
}

function retrieveLocationOfAccess(logins, accessTimestamp) {
  // user.logins.push({
  //   timestamp, location
  // });

  // convert all timestamps to utc to compare

  if(logins.length === 0) {
    throw new Error('User has no login record');

  }

  if(logins.length === 1) return logins[0].location;

  for(let i = 0; i < logins.length; i++) {
    if (moment(accessTimestamp).isBefore(parseInt(logins[i].timestamp)) || i === logins.length - 1) {
      if (i === 0) {
        throw new Error('accessTimestamp is before than first login record\'s timestamp');
      }
      return logins[i - 1].location;
    }
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

async function executeContract(opts, identity, walletContent, action, ...args) {
  const profile = connectionProfile();
  const wallet = await inMemWallet(identity, walletContent);
  const gateway = new Gateway();
  try {

    // https://stackoverflow.com/questions/56936560/why-do-i-take-more-than-2-seconds-to-just-do-a-transaction
    // https://hyperledger-fabric.readthedocs.io/en/release-2.2/developapps/connectionoptions.html
    // fast
    if (opts.fast) {
      await gateway.connect(profile, {
        wallet,
        identity,
        discovery: { enabled: true, asLocalhost: true },
        eventHandlerOptions: {
          commitTimeout: 10,
          strategy: null
        }
      });
    }
    // safe
    else {
      await gateway.connect(profile, {
        wallet,
        identity,
        discovery: { enabled: true, asLocalhost: true }
      });
    }

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

