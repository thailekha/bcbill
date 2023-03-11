const LedgerEntity = require('./LedgerEntity');

const DOCTYPE = 'ApiProvider';

class ApiProvider extends LedgerEntity {
  constructor(ctx, email) {
    super(ctx, email, { email }, DOCTYPE);
  }

  static construct(ctx, ledgerBlob) {
    const {email} = ledgerBlob;
    return new ApiProvider(ctx, email);
  }

  static async get(ctx, email, opt={ failFast: false}) {
    return await super._get(ctx, email, opt, DOCTYPE, ApiProvider);
  }

  static async getById(ctx, id, opt={ failFast: false}) {
    return await super._get(ctx, id, opt, DOCTYPE, ApiProvider);
  }
}

module.exports = {
  ApiProvider,
  DOCTYPE
};
