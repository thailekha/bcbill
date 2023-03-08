const _l = require('../lib/logger');
const CustomException = require('../lib/CustomException');
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const status = require('http-status-codes').StatusCodes;

const toLedgerBlob = i => Buffer.from(stringify(sortKeysRecursive(i)));
class LedgerEntity {
  constructor(ctx, id, value, docType) {
    if (typeof value !== 'object')
      throw new Error(`Failed to create ${docType} LedgerEntity value has to be an object`);

    this.ctx = ctx;
    this.id = id;
    value.docType = docType;
    this.value = value;
  }

  async isUnique() {
    const assetJSON = await this.ctx.stub.getState(this.id);
    if (assetJSON && assetJSON.length > 0) {
      throw new Error(`The asset ${this.id} already exists`);
    }
  }

  async create() {
    _l(`Creating ${this.value.docType} start`, this.value);
    await this.isUnique();
    await this.ctx.stub.putState(this.id, toLedgerBlob(this.value));
    _l(`Creating ${this.value.docType} finish`);
    return this.value;
  }

  async update() {
    await this.ctx.stub.putState(this.id, toLedgerBlob(this.value));
    return this.value;
  }

  static async _get(ctx, id, opt={ failFast: false}, expectedDocType, classToConstruct) {
    _l(`Get ${expectedDocType} start`, id);
    const assetJSON = await ctx.stub.getState(id);
    if (!assetJSON || assetJSON.length === 0) {
      if (opt.failFast)
        throw new CustomException(status.NOT_FOUND);
      return null;
    }
    const ledgerBlob = JSON.parse(assetJSON.toString());
    _l(`Get ${expectedDocType} finish`, id);
    return new classToConstruct(ctx, id, ...ledgerBlob.value);
  }
}

module.exports = LedgerEntity;
