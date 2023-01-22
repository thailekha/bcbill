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

const ASSET_USER = 'user';
const ASSET_ENDPOINT = 'endpoint';
const ASSET_MAPPING = 'mapping';

class DatatrustAPIContract extends Contract {
  // async InitLedger(ctx) {
  //   await ctx.stub.putState('admin', '');
  // }

  async AddUser(ctx, email, certHash) {
    await forceUniqueAsset(ctx, certHash);
    const user = {
      docType: ASSET_USER,
      email,
      logins: []
    };
    await ctx.stub.putState(certHash, ledgerVal(user));
    return user;
  }

  async AddEndpoint(ctx, path) {
    await forceUniqueAsset(ctx, path);
    const endpoint = {
      docType: ASSET_ENDPOINT,
      path
    };
    await ctx.stub.putState(path, ledgerVal(endpoint));
  }

  /**
   * When using timestamp: remember each peer has to execute this,
   * since each peer would get a different timestamp, the endorsement policy will break
   */
  async AddMapping(ctx, certHash, path) {
    const mappingId = getMappingId(certHash, path);
    await forceUniqueAsset(ctx, mappingId);
    const mapping = {
      docType: ASSET_MAPPING,
      certHash,
      path,
      forward_timestamps: [],
      // state: {},
      authorized: true
    };
    await ctx.stub.putState(mappingId, ledgerVal(mapping));
  }

  getMappingId(certHash, path) {
    return hash({ certHash, path });
  }

  async GetAsset(ctx, id, type) {
    const asset = await ctx.stub.getState(id);
    if (!asset || asset.length === 0) {
      throw new Error(`The mapping ${type} does not exist`);
    }
    return asset.toString();
  }

  async __getAsset(ctx, id, type) {
    return JSON.parse(await this.GetAsset(ctx, id, type));
  }

  async Forward(ctx, certHash, path) {
    // check path exists
    // check mapping exists
    // check that state allows
    // make specific error objects
    // generalize to get asset function 

    await this.__getAsset(ctx, path, ASSET_ENDPOINT);
    const mapping = await this.__getAsset(ctx,  getMappingId(certHash, path), ASSET_MAPPING);
    return mapping.authorized;
  }

  /*
    admin (org2): can access all users, endpoints, mappings
    normal user org1: can access all endpoints and there own mapping

    admin can revoke user's mapping
    user can just grab a mapping after signing up
  */
  // https://docs.couchdb.org/en/3.2.2/api/database/find.html#find-selectors
  async FetchAll(ctx, certHash) {
    const user = await this.__getAsset(ctx, certHash, ASSET_USER);
    const isAdmin = user.email.includes('@org2.com');

    // sort: [{ time: 'asc' }]

    // if (isAdmin) {
    //   return ({
    //     users: await this.queryCouchDb({
    //       selector:  {
    //         docType: ASSET_USER
    //       }
    //     }),

    //     endpoints: await this.queryCouchDb({
    //       selector:  {
    //         docType: ASSET_ENDPOINT
    //       }
    //     }),

    //     mapping: await this.queryCouchDb({
    //       selector:  {
    //         docType: ASSET_MAPPING
    //       }
    //     })
    //   });
    // }

    return await this.queryCouchDb({
      '$or': [
        {
          selector:  {
            docType: ASSET_USER
          }
        },
        {
          selector:  {
            docType: ASSET_ENDPOINT
          }
        },
        {
          selector:  {
            docType: ASSET_MAPPING
          }
        },
      ]
    });
  }

  async queryCouchDb(query) {
    let iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    let result = await this.getIteratorData(iterator);
    return result;
  }

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
}

//   async getPrivateMessage(ctx, collection) {
//     const message = await ctx.stub.getPrivateData(collection, "message");
//     const messageString = message.toBuffer ? message.toBuffer().toString() : message.toString();
//     return { success: messageString };
//   }

exports.contracts = [DatatrustAPIContract];
