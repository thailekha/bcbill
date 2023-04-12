const hash = require('object-hash');
const LedgerEntity = require('./LedgerEntity');

const DOCTYPE = 'OriginServer';

function makeOriginServerId(providerEntityID, serverName) {
  return hash({providerEntityID, serverName});
}

class OriginServer extends LedgerEntity {
  constructor(ctx, providerEntityID, serverName, host) {
    super(
      ctx,
      makeOriginServerId(providerEntityID, serverName),
      { providerEntityID, serverName, host },
      DOCTYPE);
  }

  static construct(ctx, ledgerBlob) {
    const { providerEntityID, serverName, host } = ledgerBlob;
    return new OriginServer(ctx, providerEntityID, serverName, host);
  }

  static async get(ctx, providerEntityID, serverName, opt={ failFast: false}) {
    return await super._get(ctx, makeOriginServerId(providerEntityID, serverName), opt, DOCTYPE, OriginServer);
  }

  static async getById(ctx, id, opt={ failFast: false}) {
    return await super._get(ctx, id, opt, DOCTYPE, OriginServer);
  }
}

module.exports = {
  OriginServer,
  DOCTYPE
};
