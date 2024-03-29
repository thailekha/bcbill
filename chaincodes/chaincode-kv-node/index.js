const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const {Contract} = require('fabric-contract-api');

// TODO: DO WE NEED ENCYPTION? MEANING 1 GLOBAL KEY?
// const crypto = require('crypto');
const hash = require('object-hash');

const ledgerVal = (i) => Buffer.from(stringify(sortKeysRecursive(i)));
const jstr = (i) => JSON.stringify(i);

async function assetExists(ctx, id) {
  const assetJSON = await ctx.stub.getState(id);
  if (!(assetJSON && assetJSON.length > 0)) {
    throw new Error(`The asset ${id} does not exist`);
  }
}

async function forceUniqueAsset(ctx, id) {
  const assetJSON = await ctx.stub.getState(id);
  if (assetJSON && assetJSON.length > 0) {
    throw new Error(`The asset ${id} already exists`);
  }
}

class EBillContract extends Contract {
  /**
   * Schema:
   * id: email ?hash of cert and id?
   */

  // async InitLedger(ctx) {
  //   await ctx.stub.putState('admin', '');
  // }

  async AddUser(ctx, email, certHash) {
    await forceUniqueAsset(ctx, certHash);
    const user = {
      docType: 'user',
      email,
      logins: []
    };
    await ctx.stub.putState(certHash, ledgerVal(user));
    return user;
  }

  async __getUser(ctx, certHash) {
    return JSON.parse(await this.GetUser(ctx, certHash));
  }

  async Login(ctx, certHash, timestamp, location) {
    const user = await this.__getUser(ctx, certHash);
    user.logins.push({
      timestamp, location
    });
    await ctx.stub.putState(certHash, ledgerVal(user));
    return user;
  }

  async GetUser(ctx, certHash) {
    const user = await ctx.stub.getState(certHash); // get the asset from chaincode state
    if (!user || user.length === 0) {
      throw new Error(`The user ${certHash} does not exist`);
    }
    return user.toString();
  }

  async GetRead(ctx, readId) {
    const read = await ctx.stub.getState(readId); // get the asset from chaincode state
    if (!read || read.length === 0) {
      throw new Error(`The read ${readId} does not exist`);
    }
    return read.toString();
  }

  // https://docs.couchdb.org/en/3.2.2/api/database/find.html#find-selectors
  async GetReads(ctx, certHash) {
    const user = await this.__getUser(ctx, certHash);
    // sort: [{ time: 'asc' }]
    const query = user.email.includes('@org2.com') ? 
      // org2 aka provider can access all reads
      ({
        selector:  {
          docType: 'read'
        }
      })
      :
      ({
        selector:  {
          docType: 'read',
          owner: certHash
        }
      });
    let iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    let result = await this.getIteratorData(iterator);
    return result;
  }

  // async GetRead(ctx, email, readId) {
  //   let queryString = {};
  //   queryString.selector = { 'docType': 'read' };
  //   let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
  //   let result = await this.getIteratorData(iterator);
  //   return JSON.stringify(result);
  // }

  async getIteratorData (iterator){
    let resultArray = [];

    while(true) {
      let res = await iterator.next();

      //res.value -- contains other metadata
      //res.value.value -- contains the actual value
      //res.value.key -- contains the key

      let resJson ={};
      if(res.value && res.value.value.toString()){
        resJson.key = res.value.key;
        resJson.value = JSON.parse(res.value.value.toString());
        resultArray.push(resJson);
      }

      if(res.done){
        iterator.close();
        return resultArray;
      }
    }
  }

  /**
   * Using timestamp here: remember each peer has to execute this,
   * since each peer would get a different timestamp, the endorsement policy will break
   */
  async AddRead(ctx, certHash, timestamp, val) {
    await assetExists(ctx, certHash);

    // dataAssets.push({
    //   guid,
    //   originalName: '',
    //   mimetype: 'application/json',
    //   lastChangedAt: (new Date()).getTime(),
    //   active: 1,
    //   owner: username,
    //   lastChangedBy: username,
    //   authorizedUsers: [],
    //   lastVersion: null,
    //   firstVersion: guid,
    //   sourceOfPublish: sourceOfPublish ? sourceOfPublish : guid
    // });

    const read = {
      docType: 'read',
      val,
      owner: certHash,
      authorizedUsers: [],
      time: parseInt(timestamp),
      active: true
    };
    const id = hash(read);
    await forceUniqueAsset(ctx, id);
    await ctx.stub.putState(id, ledgerVal(read));
    return ({
      id,
      read
    });
  }

  async TraverseHistory(ctx, key) {
    let iterator = await ctx.stub.getHistoryForKey(key);
    let result = [];
    let res = await iterator.next();
    while (!res.done) {
      if (res.value) {
        console.info(`found state update with value: ${res.value.value.toString('utf8')}`);
        res.value.value = JSON.parse(res.value.value.toString('utf8'));
        // result.push(res);
      }
      result.push(res);
      res = await iterator.next();
    }
    await iterator.close();
    return result;
  }
}

//   async getPrivateMessage(ctx, collection) {
//     const message = await ctx.stub.getPrivateData(collection, "message");
//     const messageString = message.toBuffer ? message.toBuffer().toString() : message.toString();
//     return { success: messageString };
//   }

exports.contracts = [EBillContract];
