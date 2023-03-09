const hash = require('object-hash');
const LedgerEntity = require('./LedgerEntity');

const DOCTYPE = 'OriginServer';

function makeOriginServerId(providerEmail, serverName) {
  return hash({providerEmail, serverName});
}

class OriginServer extends LedgerEntity {
  constructor(ctx, providerEmail, serverName, host) {
    super(
      ctx,
      makeOriginServerId(providerEmail, serverName),
      { providerEmail, serverName, host },
      DOCTYPE);
  }

  static construct(ctx, ledgerBlob) {
    const { providerEmail, serverName, host } = ledgerBlob;
    return new OriginServer(ctx, providerEmail, serverName, host);
  }

  static async get(ctx, providerEmail, serverName, opt={ failFast: false}) {
    return await super._get(ctx, makeOriginServerId(providerEmail, serverName), opt, DOCTYPE, OriginServer);
  }

  static async getById(ctx, id, opt={ failFast: false}) {
    return await super._get(ctx, id, opt, DOCTYPE, OriginServer);
  }
}

module.exports = {
  OriginServer,
  DOCTYPE
};
