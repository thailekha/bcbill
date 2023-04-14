'use strict';

const { Gateway } = require('fabric-network');
const fabprotos = require('fabric-protos');
const { BlockDecoder } = require('fabric-common');
const ACTIONS =  require(`${__dirname}/actions`);
const { registerClient, inMemWallet, connectionProfile } = require('../../utils');
const hash = require('object-hash');
const moment = require('moment');
const {decrypt, encrypt} = require('./crypt');

const CHANNEL = 'mychannel';
const CHAINCODE = 'chaincode1';

exports.registerUser = async (entityID, isProvider) => {
  if (isProvider !== entityID.includes('provider')) {
    const error = isProvider ? 'Provider must have "provider" in their username' : 'Client must not have "provider" in their username';
    throw new Error(error);
  }
  const walletContent = await registerClient(entityID);
  await executeContract({}, entityID, walletContent, isProvider ? ACTIONS.AddProvider : ACTIONS.AddClient, entityID);
  return encrypt(JSON.stringify(walletContent));
};

exports.GetUser = async (entityID, walletContent) => await executeContract(
  {fast: true}, entityID, walletContent, ACTIONS.GetUser);

exports.AddOriginServer = async (entityID, walletContent, serverName, host) => await executeContract(
  {}, entityID, walletContent, ACTIONS.AddOriginServer, entityID, serverName, host);

exports.AddEndpoint = async (entityID, walletContent, originServerId, path, verb) => await executeContract(
  {}, entityID, walletContent, ACTIONS.AddEndpoint, originServerId, path, verb);

exports.AddEndpointAccessGrant = async (entityID, walletContent, endpointId) => await executeContract(
  {}, entityID, walletContent, ACTIONS.AddEndpointAccessGrant, endpointId);

exports.GetEndpointAccessGrant = async (entityID, walletContent, endpointAccessGrantId) => await executeContract(
  {fast: true}, entityID, walletContent, ACTIONS.GetEndpointAccessGrant, endpointAccessGrantId);

exports.ShareAccess = async (entityID, walletContent, endpointAccessGrantId, otherClientEntityID) => await executeContract(
  {}, entityID, walletContent, ACTIONS.ShareAccess, endpointAccessGrantId, otherClientEntityID);

exports.Revoke = async (entityID, walletContent, endpointAccessGrantId) => await executeContract(
  {}, entityID, walletContent, ACTIONS.Revoke, endpointAccessGrantId);

exports.Enable = async (entityID, walletContent, endpointAccessGrantId) => await executeContract(
  {}, entityID, walletContent, ACTIONS.Enable, endpointAccessGrantId);

exports.GetOriginServerInfo = async (entityID, walletContent, endpointAccessGrantId) => await executeContract(
  {fast: true}, entityID, walletContent, ACTIONS.GetOriginServerInfo, endpointAccessGrantId);

exports.ApiProviderHomepageData = async (entityID, walletContent) => {
  const data = await executeContract(
    {fast: true}, entityID, walletContent, ACTIONS.ApiProviderHomepageData);
  return {
    'OriginServers': data.OriginServer.filter(server => server.providerEntityID === entityID).map(server => ({
      ...server,
      'Endpoints': data.Endpoint.filter(endpoint => endpoint.originServerId === server.id).map(endpoint => ({
        ...endpoint,
        'EndpointAccessGrant': data.EndpointAccessGrant.filter(access => access.endpointId === endpoint.id)
      }))
    }))
  };
};

exports.ClientHomepageData = async (entityID, walletContent) => {
  const data = await executeContract(
    {fast: true}, entityID, walletContent, ACTIONS.ClientHomepageData);
  return {
    'ApiProviders': data.ApiProvider.map(provider => ({
      ...provider,
      'OriginServers': data.OriginServer.filter(server => server.providerEntityID === provider.entityID).map(server => ({
        ...server,
        'Endpoints': data.Endpoint.filter(endpoint => endpoint.originServerId === server.id).map(endpoint => ({
          ...endpoint,
          'EndpointAccessGrant': data.EndpointAccessGrant.filter(access => access.endpointId === endpoint.id && access.clientEntityID === entityID)
        }))
      }))
    }))
  };
};

exports.Approve = async (entityID, walletContent, endpointAccessGrantId) => await executeContract(
  {}, entityID, walletContent, ACTIONS.Approve, endpointAccessGrantId);

exports.traverseHistory = async (entityID, walletContent, assetKey) => await getHistory(
  {}, entityID, walletContent, hash(walletContent.credentials.certificate), assetKey);

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
        if (!accessors[user.entityID]) {
          accessors[user.entityID] = [{
            timestamp,
            location
          }];
        } else {
          accessors[user.entityID].push({
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
  const wallet = await inMemWallet(identity, typeof walletContent === 'string' ? JSON.parse(decrypt(walletContent)): walletContent);
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

