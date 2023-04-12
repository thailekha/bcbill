const LedgerEntity = require('./LedgerEntity');

const DOCTYPE = 'ApiProvider';

class ApiProvider extends LedgerEntity {
  constructor(ctx, entityID) {
    super(ctx, entityID, { entityID }, DOCTYPE);
  }

  static construct(ctx, ledgerBlob) {
    const {entityID} = ledgerBlob;
    return new ApiProvider(ctx, entityID);
  }

  static async get(ctx, entityID, opt={ failFast: false}) {
    return await super._get(ctx, entityID, opt, DOCTYPE, ApiProvider);
  }

  static async getById(ctx, id, opt={ failFast: false}) {
    return await super._get(ctx, id, opt, DOCTYPE, ApiProvider);
  }
}

module.exports = {
  ApiProvider,
  DOCTYPE
};
