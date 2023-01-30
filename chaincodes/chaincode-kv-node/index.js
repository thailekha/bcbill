const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const {Contract} = require('fabric-contract-api');

// TODO: DO WE NEED ENCYPTION? MEANING 1 GLOBAL KEY?
// const crypto = require('crypto');
const hash = require('object-hash');

const ledgerVal = (i) => Buffer.from(stringify(sortKeysRecursive(i)));
const jstr = (i) => JSON.stringify(i);
const cowsay = require('cowsay');

function _l(...stuff) {
  const text = stuff
    .map(s => (typeof s === 'object') ? jstr(s) : s)
    .join('\n');
  console.log(cowsay.say({text}));
}

function addItemToArrayInObject(obj, arrayName, item) {
  if (typeof obj[arrayName] === 'undefined')
    obj[arrayName] = [item];
  else
    obj[arrayName].push(item);
}

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

  async Ping(ctx, text) {
    _l('Ping');
    return {pong: text};
  }

  async AddUser(ctx, email, certHash) {
    _l('AddUser start');

    await forceUniqueAsset(ctx, certHash);
    const user = {
      docType: ASSET_USER,
      email,
      logins: []
    };
    await ctx.stub.putState(certHash, ledgerVal(user));

    _l('AddUser finish');
    return user;
  }

  async AddEndpoint(ctx, path) {
    _l('AddEndpoint start');

    // check for admin
    await forceUniqueAsset(ctx, path);
    const endpoint = {
      docType: ASSET_ENDPOINT,
      path
    };
    await ctx.stub.putState(path, ledgerVal(endpoint));

    _l('AddEndpoint finish');
    return endpoint;
  }

  /**
   * When using timestamp: remember each peer has to execute this,
   * since each peer would get a different timestamp, the endorsement policy will break
   */
  async AddMapping(ctx, email, certHash, path) {
    _l('AddMapping start');

    const mappingId = this.getMappingId(certHash, path);
    await forceUniqueAsset(ctx, mappingId);
    const mapping = {
      docType: ASSET_MAPPING,
      email,
      certHash,
      path,
      forward_timestamps: [],
      // state: {},
      authorized: true
    };
    await ctx.stub.putState(mappingId, ledgerVal(mapping));

    _l('AddMapping finish');
    return mapping;
  }

  getMappingId(certHash, path) {
    return hash({ certHash, path });
  }

  async GetAsset(ctx, id, type) {
    _l('GetAsset start');

    const asset = await ctx.stub.getState(id);
    if (!asset || asset.length === 0) {
      throw new Error(`The mapping ${type} does not exist`);
    }

    _l('GetAsset finish');
    return asset.toString();
  }

  async __getAsset(ctx, id, type) {
    return JSON.parse(await this.GetAsset(ctx, id, type));
  }

  async Forward(ctx, certHash, path) {
    _l('Forward start');

    // check path exists
    // check mapping exists
    // check that state allows
    // make specific error objects?

    await this.__getAsset(ctx, path, ASSET_ENDPOINT);
    const mapping = await this.__getAsset(ctx, this.getMappingId(certHash, path), ASSET_MAPPING);

    _l('Forward finish');
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
    _l('FetchAll start');

    const user = await this.__getAsset(ctx, certHash, ASSET_USER);
    const isAdmin = user.email.includes('@org2.com');

    // sort: [{ time: 'asc' }]

    const adminQuery = [
      {
        docType: ASSET_USER
      },
      {
        docType: ASSET_ENDPOINT
      },
      {
        docType: ASSET_MAPPING
      }
    ];

    const normalUserQuery = [
      {
        docType: ASSET_ENDPOINT
      },
      {
        docType: ASSET_MAPPING,
        certHash
      }
    ];

    const query_result = await this.queryCouchDb(ctx, {
      selector: {
        '$or': isAdmin ? adminQuery : normalUserQuery
      },
      fields: [
        'docType', 'email', 'path', 'certHash'
      ]
    });

    const res = query_result.reduce((result, item) => {
      addItemToArrayInObject(result, item.value.docType + 's', item);
      return result;
    }, {});

    _l('FetchAll finish', res);

    return res;
  }

  async queryCouchDb(ctx, query) {
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
