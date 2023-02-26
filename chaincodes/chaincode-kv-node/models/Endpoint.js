const LedgerEntity = require('./LedgerEntity');

const DOCTYPE = 'endpoint';
class Endpoint extends LedgerEntity {
  constructor(ctx, path) {
    super(ctx, path, { path }, DOCTYPE);
  }

  static async _get(ctx, id, customStatus) {
    const data = await super._get(ctx, id, customStatus);
    if (data.docType !== DOCTYPE) {
      throw new Error(`The asset ${id} is not an endpoint`);
    }
    return new Endpoint(ctx, data.path);
  }
}

module.exports = {Endpoint,
  DOCTYPE
};
