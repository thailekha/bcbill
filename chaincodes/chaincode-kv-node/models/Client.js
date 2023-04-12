const LedgerEntity = require('./LedgerEntity');

const DOCTYPE = 'Client';

class Client extends LedgerEntity {
  constructor(ctx, entityID) {
    super(ctx, entityID, { entityID }, DOCTYPE);
  }

  static construct(ctx, ledgerBlob) {
    const {entityID} = ledgerBlob;
    return new Client(ctx, entityID);
  }

  static async get(ctx, entityID, opt={ failFast: false}) {
    return await super._get(ctx, entityID, opt, DOCTYPE, Client);
  }

  static async getById(ctx, id, opt={ failFast: false}) {
    return await super._get(ctx, id, opt, DOCTYPE, Client);
  }
}

module.exports = {
  Client,
  DOCTYPE
};
