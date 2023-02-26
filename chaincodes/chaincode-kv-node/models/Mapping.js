const LedgerEntity = require('./LedgerEntity');
const hash = require('object-hash');
const _l = require('../lib/logger');
const CustomException = require('../lib/CustomException');
const {fromAdmin} = require('../lib/contract-utils');
const status = require('http-status-codes').StatusCodes;

const getMappingId = (certHash, path) => hash({certHash, path});

const DOCTYPE = 'mapping';

/**
 * When using timestamp: remember each peer has to execute this,
 * since each peer would get a different timestamp, the endorsement policy will break
 */
class Mapping  extends LedgerEntity {
  constructor(ctx, email, certHash, path, authorized= true) {
    super(ctx, getMappingId(certHash, path), {
      email,
      certHash,
      path,
      authorized,
    }, DOCTYPE);
  }

  static getMappingId = (certHash, path) => hash({certHash, path});

  static async _get(ctx, id, opt= {failFast: false}) {
    // check path exists
    // check mapping exists
    // check that state allows

    const data = await super._get(ctx, id, opt);
    if (data === null) {
      throw new CustomException(status.FORBIDDEN);
    }
    if (data.docType !== DOCTYPE) {
      throw new CustomException(status.BAD_REQUEST);
    }
    return new Mapping(ctx, data.email, data.certHash, data.path, data.authorized);
  }

  static async find(ctx, certHash, path) {
    return await this._get(ctx, this.getMappingId(certHash, path));
  }

  async setAuthorized(authorized) {
    _l('setAuthorized start', this.value.path, authorized);
    fromAdmin(this.ctx);
    this.value.authorized = authorized;
    _l('setAuthorized finish');
    return await this.update();
  }
}

module.exports = {
  Mapping,
  DOCTYPE
};
