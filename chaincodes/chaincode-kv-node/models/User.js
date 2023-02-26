const _l = require('../lib/logger');
const LedgerEntity = require('./LedgerEntity');

const DOCTYPE = 'user';

class User extends LedgerEntity {
  constructor(ctx, email, certHash) {
    super(ctx, certHash, { email }, DOCTYPE);
  }

  static async _get(ctx, id, opt = {failFast: false}) {
    const data = await super._get(ctx, id, opt);
    if (data.docType !== DOCTYPE) {
      throw new Error(`The asset ${id} is not a user`);
    }
    return new User(ctx, data.email, id);
  }
}

module.exports = {User,
  DOCTYPE
};
