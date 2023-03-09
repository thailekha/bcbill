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

    _l('New', docType, id, value);

    this.ctx = ctx;
    this.id = id;
    value.docType = docType;
    this.value = value;
  }

  getCopy() {
    // return JSON.parse(JSON.stringify(this));
    const copy = this.value;
    copy.id = this.id;
    return copy;
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
  }

  async update() {
    _l('Updating ledger data', this.id, this.value)
    await this.ctx.stub.putState(this.id, toLedgerBlob(this.value));
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

    // order of the args
    return classToConstruct.construct(ctx, ledgerBlob);
  }
}

module.exports = LedgerEntity;
