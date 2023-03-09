const LedgerEntity = require('./LedgerEntity');

const DOCTYPE = 'Client';

class Client extends LedgerEntity {
  constructor(ctx, email) {
    super(ctx, email, { email }, DOCTYPE);
  }

  static construct(ctx, id) {
    return new Client(ctx, id);
  }

  static async get(ctx, email, opt={ failFast: false}) {
    return await super._get(ctx, email, opt, DOCTYPE, Client);
  }

  static async getById(ctx, id, opt={ failFast: false}) {
    return await super._get(ctx, id, opt, DOCTYPE, Client);
  }
}

module.exports = {
  Client,
  DOCTYPE
};
