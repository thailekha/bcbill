const LedgerEntity = require('./LedgerEntity');
const hash = require('object-hash');

const DOCTYPE = 'Endpoint';

function makeEndpointId(providerEmail, host, path, verb) {
  return hash({providerEmail, host, path, verb});
}

class Endpoint extends LedgerEntity {
  constructor(ctx, providerEmail, host, path, verb) {
    super(
      ctx,
      makeEndpointId(providerEmail, host, path, verb),
      { providerEmail, host, path, verb },
      DOCTYPE);
  }

  static async get(ctx, providerEmail, host, path, verb, opt={ failFast: false}) {
    return await super._get(ctx, makeEndpointId(providerEmail, host, path, verb), opt, DOCTYPE, Endpoint);
  }

  static async getById(ctx, id, opt={ failFast: false}) {
    return await super._get(ctx, id, opt, DOCTYPE, Endpoint);
  }
}

module.exports = {
  Endpoint,
  DOCTYPE
};
