const {
  Gateway,
  Wallets
} = require('fabric-network');
const fs = require('fs');
const path = require("path")
const log4js = require('log4js');
const logger = log4js.getLogger('BasicNetwork');
const util = require('util')
const {
  BlockDecoder
} = require('fabric-common');
const fabprotos = require('fabric-protos');
const helper = require('./helper')
const cscc = async (channelName, username, org_name) => {

  try {

    // load the network configuration
    // const ccpPath = path.resolve(__dirname, '..', 'config', 'connection-bank.json');
    // const ccpJSON = fs.readFileSync(ccpPath, 'utf8')
    const ccp = await helper.getCCP(org_name) //JSON.parse(ccpJSON);
    // Create a new file system based wallet for managing identities.
    const walletPath = await helper.getWalletPath(org_name) //.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);
    // Check to see if we've already enrolled the user.
    let identity = await wallet.get(username);
    if (!identity) {
      console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
      await helper.getRegisteredUser(username, org_name, true)
      identity = await wallet.get(username);
      console.log('Run the registerUser.js application before retrying');
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: username,
      discovery: {
        enabled: true,
        asLocalhost: true
      }
    });

    console.log("---after gateway---")

    let trasctionDetails = [];

    const network = await gateway.getNetwork(channelName);
    const contract = await network.getContract('qscc');

    const resultByte = await contract.evaluateTransaction(
      'GetChainInfo',
      channelName
    );

    const resultJson = await fabprotos.common.BlockchainInfo.decode(resultByte);
    console.log('queryChainInfo', JSON.parse(JSON.stringify(resultJson)).height);
    let height = parseInt(JSON.parse(JSON.stringify(resultJson)).height)
    const contract1 = network.getContract("qscc");

    for (let i = 0; i < height; i++) {

      result = await contract1.evaluateTransaction("GetBlockByNumber", "mychannel", i);
      block = BlockDecoder.decode(result);
      console.log("block.blockData", JSON.stringify(block.data))
      const dataArray = block.data.data;
      const txSuccess = block.metadata.metadata[2];


      for (var dataItem in dataArray) {

        // reject if a timestamp is not set
        if (dataArray[dataItem].payload.header.channel_header.timestamp == undefined) {
          reject(new Error('Transaction timestamp is not defined'));
        }

        // tx may be rejected at commit stage by peers
        // only valid transactions (code=0) update the word state and off-chain db
        // filter through valid tx, refer below for list of error codes
        // https://github.com/hyperledger/fabric-sdk-node/blob/release-1.4/fabric-client/lib/protos/peer/transaction.proto
        if (txSuccess[dataItem] !== 0) {
          continue;
        }

        const timestamp = dataArray[dataItem].payload.header.channel_header.timestamp;

        const txtid = dataArray[dataItem].payload.header.channel_header["tx_id"];

        // continue to next tx if no actions are set
        if (dataArray[dataItem].payload.data.actions == undefined) {
          continue;
        }

        // actions are stored as an array. In Fabric 1.4.3 only one
        // action exists per tx so we may simply use actions[0]
        // in case Fabric adds support for multiple actions
        // a for loop is used for demonstration
        const actions = dataArray[dataItem].payload.data.actions;

        // iterate through all actions
        for (var actionItem in actions) {

          // reject if a chaincode id is not defined
          if (actions[actionItem].payload.chaincode_proposal_payload.input.chaincode_spec.chaincode_id.name == undefined) {
            reject(new Error('Chaincode name is not defined'));
          }

          const chaincodeID = actions[actionItem].payload.chaincode_proposal_payload.input.chaincode_spec["chaincode_id"].name

          // reject if there is no readwrite set
          if (actions[actionItem].payload.action.proposal_response_payload.extension.results.ns_rwset == undefined) {
            reject(new Error('No readwrite set is defined'));
          }

          const rwSet = actions[actionItem].payload.action.proposal_response_payload.extension.results.ns_rwset

          for (var record in rwSet) {

            // ignore lscc events
            if (rwSet[record].namespace != 'lscc') {
              // create object to store properties
              const writeObject = new Object();
              writeObject.blocknumber = i;
              writeObject.txtid = txtid
              writeObject.chaincodeid = chaincodeID;
              writeObject.timestamp = timestamp;
              writeObject.values = rwSet[record].rwset.writes;



              const values = writeObject.values;
              let txresult = await contract.evaluateTransaction("GetTransactionByID", "mychannel", txtid);
              txresult = BlockDecoder.decodeTransaction(txresult);
              trasctionDetails.push({
                "txtid": txtid,
                result: txresult,
                raw_value
              })
              console.log(`Transaction details: ${trasctionDetails}`);
              //    console.log(`Transaction Timestamp: ${writeObject.timestamp}`);
              //   console.log(`Txid: ${writeObject.txtid}`);
              //   console.log(`chaincode: ${writeObject.chaincodeid}`);
              let dataVlaue = values.value;
              if (values.value) dataVlaue = dataVlaue.toString();
              // console.log("Data",dataVlaue);
              //       console.log("Data", txresult.transactionEnvelope.payload.data.actions[0].payload);
            }
          }
        }

      }


    }
    console.log("-----trasctionDetails---", trasctionDetails)
    return trasctionDetails;


  } catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
    return error.message
  }
}


const minimalData = async (channelName, username, org_name) => {

  try {

    // load the network configuration
    // const ccpPath = path.resolve(__dirname, '..', 'config', 'connection-bank.json');
    // const ccpJSON = fs.readFileSync(ccpPath, 'utf8')
    const ccp = await helper.getCCP(org_name) //JSON.parse(ccpJSON);
    // Create a new file system based wallet for managing identities.
    const walletPath = await helper.getWalletPath(org_name) //.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);
    // Check to see if we've already enrolled the user.
    let identity = await wallet.get(username);
    if (!identity) {
      console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
      await helper.getRegisteredUser(username, org_name, true)
      identity = await wallet.get(username);
      console.log('Run the registerUser.js application before retrying');
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: username,
      discovery: {
        enabled: true,
        asLocalhost: true
      }
    });

    console.log("---after gateway---")

    let trasctionDetails = [];

    const network = await gateway.getNetwork(channelName);
    const contract = await network.getContract('qscc');

    const resultByte = await contract.evaluateTransaction(
      'GetChainInfo',
      channelName
    );

    const resultJson = await fabprotos.common.BlockchainInfo.decode(resultByte);
    console.log('queryChainInfo', JSON.parse(JSON.stringify(resultJson)).height);
    let height = parseInt(JSON.parse(JSON.stringify(resultJson)).height)
    const contract1 = network.getContract("qscc");

    for (let i = 0; i < height; i++) {

      result = await contract1.evaluateTransaction("GetBlockByNumber", "mychannel", i);
      block = BlockDecoder.decode(result);
      console.log("block.blockData", JSON.stringify(block.data))
      const dataArray = block.data.data;
      const txSuccess = block.metadata.metadata[2];


      for (var dataItem in dataArray) {

        // reject if a timestamp is not set
        if (dataArray[dataItem].payload.header.channel_header.timestamp == undefined) {
          reject(new Error('Transaction timestamp is not defined'));
        }

        // tx may be rejected at commit stage by peers
        // only valid transactions (code=0) update the word state and off-chain db
        // filter through valid tx, refer below for list of error codes
        // https://github.com/hyperledger/fabric-sdk-node/blob/release-1.4/fabric-client/lib/protos/peer/transaction.proto
        if (txSuccess[dataItem] !== 0) {
          continue;
        }

        const timestamp = dataArray[dataItem].payload.header.channel_header.timestamp;

        const txtid = dataArray[dataItem].payload.header.channel_header["tx_id"];

        // continue to next tx if no actions are set
        if (dataArray[dataItem].payload.data.actions == undefined) {
          continue;
        }

        // actions are stored as an array. In Fabric 1.4.3 only one
        // action exists per tx so we may simply use actions[0]
        // in case Fabric adds support for multiple actions
        // a for loop is used for demonstration
        const actions = dataArray[dataItem].payload.data.actions;

        // iterate through all actions
        for (var actionItem in actions) {

          // reject if a chaincode id is not defined
          if (actions[actionItem].payload.chaincode_proposal_payload.input.chaincode_spec.chaincode_id.name == undefined) {
            reject(new Error('Chaincode name is not defined'));
          }

          const chaincodeID = actions[actionItem].payload.chaincode_proposal_payload.input.chaincode_spec["chaincode_id"].name

          // reject if there is no readwrite set
          if (actions[actionItem].payload.action.proposal_response_payload.extension.results.ns_rwset == undefined) {
            reject(new Error('No readwrite set is defined'));
          }

          const rwSet = actions[actionItem].payload.action.proposal_response_payload.extension.results.ns_rwset

          for (var record in rwSet) {

            // ignore lscc events
            if (rwSet[record].namespace != 'lscc') {
              // create object to store properties
              const writeObject = new Object();
              writeObject.blocknumber = i;
              writeObject.txtid = txtid
              writeObject.chaincodeid = chaincodeID;
              writeObject.timestamp = timestamp;
              writeObject.values = rwSet[record].rwset.writes;



              const values = writeObject.values;
              let txresult = await contract.evaluateTransaction("GetTransactionByID", "mychannel", txtid);
              txresult = BlockDecoder.decodeTransaction(txresult);
              trasctionDetails.push({
                "txtid": txtid,
                result: writeObject
              })
              console.log(`Transaction details: ${trasctionDetails}`);
              //    console.log(`Transaction Timestamp: ${writeObject.timestamp}`);
              //   console.log(`Txid: ${writeObject.txtid}`);
              //   console.log(`chaincode: ${writeObject.chaincodeid}`);
              let dataVlaue = values.value;
              if (values.value) dataVlaue = dataVlaue.toString();
              // console.log("Data",dataVlaue);
              //       console.log("Data", txresult.transactionEnvelope.payload.data.actions[0].payload);
            }
          }
        }

      }


    }
    console.log("-----trasctionDetails---", trasctionDetails)
    return trasctionDetails;


  } catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
    return error.message
  }
}

exports.cscc = cscc

exports.minimalData = minimalData

//console.log(this.cscc('mychannel','renjith','Bank'))