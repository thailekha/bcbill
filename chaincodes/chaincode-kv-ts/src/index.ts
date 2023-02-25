import { Context, Contract } from 'fabric-contract-api';
import { ClientIdentity } from 'fabric-shim';
import { StatusCodes } from 'http-status-codes';
import * as cowsay from 'cowsay';
import hash from 'object-hash';
import sortKeysRecursive from'sort-keys-recursive'
import stringify from 'json-stringify-deterministic';

const ledgerVal = (i: any) => Buffer.from(stringify(sortKeysRecursive(i)));
const jstr = (i: any) => JSON.stringify(i);

function _l(...stuff: any[]) {
  const text = stuff
      .map((s) => (typeof s === 'object' ? jstr(s) : s))
      .join('\n');
  console.log(cowsay.say({ text }));
}
function addItemToArrayInObject(obj: any, arrayName: string, item: any) {
  if (typeof obj[arrayName] === 'undefined')
    obj[arrayName] = [item];
  else
    obj[arrayName].push(item);
}

function parseCommonNameFromx509DistinguishedName(dn: string) {
  const parseResult = dn
      .split('::')[1]
      .split('/')
      .filter(i => i.length > 0 && i.includes('CN='))
      .map(i => i.split('=')[1]);
  return parseResult[0];
}

function fromAdmin(ctx: Context, throwErr = true) {
  const cid = new ClientIdentity(ctx.stub);
  const email = parseCommonNameFromx509DistinguishedName(cid.getID());
  const isAdmin = email.includes('@org2.com');
  if (!isAdmin && throwErr) {
    console.log('Not admin: ', cid.getID(), email);
    throw new CustomException(StatusCodes.FORBIDDEN);
  }
  return isAdmin;
}

async function assetExists(ctx: Context, id: string) {
  const assetJSON = await ctx.stub.getState(id);
  if (!(assetJSON && assetJSON.length > 0)) {
    throw new Error(`The asset ${id} does not exist`);
  }
}

async function forceUniqueAsset(ctx: Context, id: string) {
  const assetJSON = await ctx.stub.getState(id);
  if (assetJSON && assetJSON.length > 0) {
    throw new Error(`The asset ${id} already exists`);
  }
}

const ASSET_USER = 'user';
const ASSET_ENDPOINT = 'endpoint';
const ASSET_MAPPING = 'mapping';

class DatatrustAPIContract extends Contract {
  async Ping(ctx: Context, text: string) {
    console.log('Ping');
    return {pong: text};
  }

  async AddUser(ctx: Context, email: string, certHash: string) {
    console.log('AddUser start');
    await forceUniqueAsset(ctx, certHash);
    const user = {
      docType: ASSET_USER,
      email,
      logins: [],
    };
    await ctx.stub.putState(certHash, ledgerVal(user));

    console.log('AddUser finish');
    return user;
  }

  async AddEndpoint(ctx: Context, path: string) {
    console.log('AddEndpoint start');
    fromAdmin(ctx);
    await forceUniqueAsset(ctx, path);
    const endpoint = {
      docType: ASSET_ENDPOINT,
      path,
    };
    await ctx.stub.putState(path, ledgerVal(endpoint));

    console.log('AddEndpoint finish');
    return endpoint;
  }

  async AddMapping(ctx: Context, email: string, certHash: string, path: string) {
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

  async __setAuthorizedForMapping(ctx: Context, certHash: string, path: string, authorized: boolean) {
    _l('__setAuthorizedForMapping start', certHash, path, authorized);
    fromAdmin(ctx);
    const mappingId = this.getMappingId(certHash, path);
    const mapping = await this.__getAsset(
        ctx,
        mappingId,
        ASSET_MAPPING,
        StatusCodes.NOT_FOUND
    );
    mapping.authorized = authorized;
    await ctx.stub.putState(mappingId, ledgerVal(mapping));
    _l('__setAuthorizedForMapping finish', certHash, path, authorized);
    return mapping;
  }

  async RevokeMapping(ctx: Context, certHash: string, path: string) {
    return await this.__setAuthorizedForMapping(ctx, certHash, path, false);
  }

  async ReenableMapping(ctx: Context, certHash: string, path: string) {
    return await this.__setAuthorizedForMapping(ctx, certHash, path, true);
  }

  getMappingId(certHash: string, path: string) {
    return hash({ certHash, path });
  }

  async GetAsset(ctx: Context, id: string, type: string, customStatus: number | null = null) {
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

  async __getAsset(ctx: Context, id: string, type: string, customStatus: number | null = null) {
    return JSON.parse(await this.GetAsset(ctx, id, type, customStatus));
  }

  async Forward(ctx: Context, certHash: string, path: string) {
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
        StatusCodes.FORBIDDEN
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
  async FetchAll(ctx: Context, certHash: string) {
    _l('FetchAll start');

    const user = await this.__getAsset(ctx, certHash, ASSET_USER);
    const isAdmin = user.email.includes('@org2.com');

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

    const queryResult = await this.queryCouchDb(ctx, {
      selector: {
        '$or': isAdmin ? adminQuery : normalUserQuery
      },
      fields: [
        'docType', 'email', 'path', 'certHash', 'authorized'
      ]
    });

    const res = queryResult.reduce((result, item) => {
      addItemToArrayInObject(result, item.value.docType + 's', item.value);
      return result;
    }, {});

    _l('FetchAll finish', res);

    return res;
  }

  async queryCouchDb(ctx: Context, query: any) {
    let iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    let result = await this.getIteratorData(iterator);
    return result;
  }

  async getIteratorData(iterator: any) {
    let resultArray = [];

    while (true) {
      let res = await iterator.next();
      
      if (res.value && res.value.value.toString()) {
        resultArray.push({
          key: res.value.key,
          value: JSON.parse(res.value.value.toString())
        });
      }

      if (res.done) {
        iterator.close();
        return resultArray;
      }
    }
  }
}

class CustomException extends Error {
  private statusCode: number;
  constructor(statusCode: number) {
    super(statusCode.toString());
    this.statusCode = statusCode;
  }
}

export { DatatrustAPIContract };