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

  async AddUser(ctx, email) {
    await forceUniqueAsset(ctx, email);
    const user = { email };
    await ctx.stub.putState(email, ledgerVal(user));
    return jstr(user);
  }

  async __getUser(ctx, email) {
    const user = await ctx.stub.getState(email); // get the asset from chaincode state
    if (!user || user.length === 0) {
      throw new Error(`The user ${email} does not exist`);
    }
    return user;
  }

  async GetUser(ctx, id) {
    const user = await ctx.stub.getState(id); // get the asset from chaincode state
    if (!user || user.length === 0) {
      throw new Error(`The user ${id} does not exist`);
    }
    return user.toString();
  }

  async AddRead(ctx, email, val) {
    await assetExists(ctx, email);

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
      val,
      owner: email,
      authorizedUsers: [],
      time: (new Date()).getTime(),
      active: true
    };
    const id = hash(read);
    await forceUniqueAsset(ctx, id);
    await ctx.stub.putState(id, ledgerVal(read));
    return jstr(read);
  }
}

//   async getPrivateMessage(ctx, collection) {
//     const message = await ctx.stub.getPrivateData(collection, "message");
//     const messageString = message.toBuffer ? message.toBuffer().toString() : message.toString();
//     return { success: messageString };
//   }

exports.contracts = [EBillContract];
