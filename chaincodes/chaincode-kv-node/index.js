const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const {Contract} = require('fabric-contract-api');
const status = require('http-status-codes').StatusCodes;
const ClientIdentity = require('fabric-shim').ClientIdentity;

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

function parseCommonNameFromx509DistinguishedName(dn) {
  //'x509::/OU=org2/OU=client/OU=department1/CN=staff1@org2.com::/C=US/ST=California/L=San Francisco/O=org2.example.com/CN=ca.org2.example.com'
  const parseResult = dn.split('::')[1].split('/').filter(i => i.length > 0 && i.includes('CN=')).map(i => i.split('=')[1]);
  return parseResult[0];
}

function fromAdmin(ctx, throwErr=true) {
  const cid = new ClientIdentity(ctx.stub);
  const email = parseCommonNameFromx509DistinguishedName(cid.getID());
  const isAdmin = email.includes('@org2.com');
  if (!isAdmin && throwErr) {
    _l('Not admin: ', cid.getID(), email);
    throw new CustomException(status.FORBIDDEN);
  }
  return isAdmin;
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
    fromAdmin(ctx);
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
    _l('AddMapping start', email, certHash, path);

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

  async __setAuthorizedForMapping(ctx, certHash, path, authorized) {
    _l('__setAuthorizedForMapping start', certHash, path, authorized);
    fromAdmin(ctx);
    const mappingId = this.getMappingId(certHash, path);
    const mapping = await this.__getAsset(
      ctx,
      mappingId,
      ASSET_MAPPING,
      status.NOT_FOUND
    );
    mapping.authorized = authorized;
    await ctx.stub.putState(mappingId, ledgerVal(mapping));
    _l('__setAuthorizedForMapping finish', certHash, path, authorized);
    return mapping;
  }

  async RevokeMapping(ctx, certHash, path) {
    return await this.__setAuthorizedForMapping(ctx, certHash, path, false);
  }

  async ReenableMapping(ctx, certHash, path) {
    return await this.__setAuthorizedForMapping(ctx, certHash, path, true);
  }

  getMappingId(certHash, path) {
    return hash({ certHash, path });
  }

  async GetAsset(ctx, id, type, customStatus=null) {
    _l('GetAsset start', id, type);

    const asset = await ctx.stub.getState(id);
    if (!asset || asset.length === 0) {
      if (customStatus)
        throw new CustomException(customStatus);
      throw new Error(`The mapping ${type} does not exist`);
    }

    _l('GetAsset finish');
    return asset.toString();
  }

  async __getAsset(ctx, id, type, customStatus=null) {
    return JSON.parse(await this.GetAsset(ctx, id, type, customStatus));
  }

  async Forward(ctx, certHash, path) {
    _l('Forward start', certHash, path);

    // check path exists
    // check mapping exists
    // check that state allows

    // await this.__getAsset(
    //   ctx,
    //   path,
    //   ASSET_ENDPOINT,
    //   status.NOT_FOUND
    // );

    const mapping = await this.__getAsset(
      ctx,
      this.getMappingId(certHash, path),
      ASSET_MAPPING,
      status.FORBIDDEN
    );

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
        'docType', 'email', 'path', 'certHash', 'authorized'
      ]
    });

    const res = query_result.reduce((result, item) => {
      addItemToArrayInObject(result, item.value.docType + 's', item.value);
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

// if error instanceof CustomException
class CustomException extends Error {
  constructor(statusCode) {
    super(statusCode);
    this.statusCode = statusCode;
  }
}

exports.contracts = [DatatrustAPIContract];
