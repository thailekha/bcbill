const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const {Contract} = require('fabric-contract-api');
// const crypto = require('crypto');

const ledgerVal = (i) => Buffer.from(stringify(sortKeysRecursive(i)));
const jstr = (i) => JSON.stringify(i);

async function assetExists(ctx, id) {
  const assetJSON = await ctx.stub.getState(id);
  return assetJSON && assetJSON.length > 0;
}

class UsersManagementContract extends Contract {
  /**
   * Schema:
   * id: email ?hash of cert and id?
   */

  // async InitLedger(ctx) {
  //   await ctx.stub.putState('admin', '');
  // }

  async CreateUser(ctx, id) {
    const exists = await assetExists(ctx, id);
    if (exists) {
      throw new Error(`The user ${id} already exists`);
    }
    const user = {
      id
    };
    await ctx.stub.putState(id, ledgerVal(user));
    return jstr(user);
  }

  async ReadUser(ctx, id) {
    const user = await ctx.stub.getState(id); // get the asset from chaincode state
    if (!user || user.length === 0) {
      throw new Error(`The user ${id} does not exist`);
    }
    return user.toString();
  }
}

//   async getPrivateMessage(ctx, collection) {
//     const message = await ctx.stub.getPrivateData(collection, "message");
//     const messageString = message.toBuffer ? message.toBuffer().toString() : message.toString();
//     return { success: messageString };
//   }

exports.contracts = [UsersManagementContract];
