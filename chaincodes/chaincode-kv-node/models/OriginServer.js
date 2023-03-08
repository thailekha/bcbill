

/*

I have two entities: APIprovider, with "email" as the primary key; Originserver, with "host" as the primary key;
Endpoint, with "path" as the primary key. APIprovider contains an array of host strings, indicating a one-to-many relationship
with Originserver. Originserver contains an array of path strings, indicating a one-to-many relationship with Endpoint.
Could you please provide me with a JSON CouchDB query that retrieves all Endpoint objects associated with a given APIprovider email?

 */

const hash = require('object-hash');
const LedgerEntity = require('./LedgerEntity');

const DOCTYPE = 'OriginServer';

function makeOriginServerId(providerEmail, host) {
  return hash({providerEmail, host});
}

class OriginServer extends LedgerEntity {
  constructor(ctx, providerEmail, host) {
    super(
      ctx,
      makeOriginServerId(providerEmail, host),
      { providerEmail, host },
      DOCTYPE);
  }

  static async get(ctx, providerEmail, host, opt={ failFast: false}) {
    return await super._get(ctx, makeOriginServerId(providerEmail, host), opt, DOCTYPE, OriginServer);
  }

  static async getById(ctx, id, opt={ failFast: false}) {
    return await super._get(ctx, id, opt, DOCTYPE, OriginServer);
  }
}

module.exports = {
  OriginServer,
  DOCTYPE
};
