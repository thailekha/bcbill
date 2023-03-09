const LedgerEntity = require('./LedgerEntity');
const hash = require('object-hash');

const DOCTYPE = 'Endpoint';

function makeEndpointId(originServerId, path, verb) {
  return hash({originServerId, path, verb});
}

class Endpoint extends LedgerEntity {
  constructor(ctx, originServerId, path, verb) {
    super(
      ctx,
      makeEndpointId(originServerId, path, verb),
      { originServerId, path, verb },
      DOCTYPE);
  }

  static construct(ctx, ledgerBlob) {
    const { originServerId, path, verb } = ledgerBlob;
    return new Endpoint(ctx, originServerId, path, verb);
  }

  static async get(ctx, originServerId, path, verb, opt={ failFast: false}) {
    return await super._get(ctx, makeEndpointId(originServerId, path, verb), opt, DOCTYPE, Endpoint);
  }

  static async getById(ctx, id, opt={ failFast: false}) {
    return await super._get(ctx, id, opt, DOCTYPE, Endpoint);
  }
}

module.exports = {
  Endpoint,
  DOCTYPE
};
