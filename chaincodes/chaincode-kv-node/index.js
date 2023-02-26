const {Contract} = require('fabric-contract-api');
const _l = require('./lib/logger');
const { User, DOCTYPE: USER_DOCTYPE} = require('./models/User');
const { Endpoint, DOCTYPE: ENDPOINT_DOCTYPE}   = require('./models/Endpoint');
const { Mapping, DOCTYPE: MAPPING_DOCTYPE}  = require('./models/Mapping');
const {query} = require('./lib/couchDbController');
const {fromAdmin} = require('./lib/contract-utils');

class APISentryContract extends Contract {
  async Ping(ctx, text) {
    return {pong: text};
  }

  async AddUser(ctx, email, certHash) {
    return await(new User(ctx, email, certHash)).create();
  }

  async AddEndpoint(ctx, path) {
    return await(new Endpoint(ctx, path)).create();
  }

  async AddMapping(ctx, email, certHash, path) {
    return await(new Mapping(ctx, email, certHash, path)).create();
  }

  async RevokeMapping(ctx, certHash, path) {
    const mapping = await Mapping.find(ctx, certHash, path);
    return await mapping.setAuthorized(false);
  }

  async ReenableMapping(ctx, certHash, path) {
    const mapping = await Mapping.find(ctx, certHash, path);
    return await mapping.setAuthorized(true);
  }

  async Forward(ctx, certHash, path) {
    _l('Forward start', certHash, path);
    const mapping = await Mapping.find(ctx, certHash, path);
    _l('Forward finish');
    return mapping.value.authorized;
  }

  /*
    admin (org2): can access all users, endpoints, mappings
    normal user org1: can access all endpoints and there own mapping

    admin can revoke user's mapping
    user can just grab a mapping after signing up
  */
  // https://docs.couchdb.org/en/3.2.2/api/database/find.html#find-selectors
  async FetchAll(ctx, certHash) {
    _l('FetchAll start');

    // sort: [{ time: 'asc' }]

    const adminQuery = [
      {
        docType: USER_DOCTYPE
      },
      {
        docType: ENDPOINT_DOCTYPE
      },
      {
        docType: MAPPING_DOCTYPE
      }
    ];

    const normalUserQuery = [
      {
        docType: ENDPOINT_DOCTYPE
      },
      {
        docType: MAPPING_DOCTYPE,
        certHash
      }
    ];

    const query_result = await query(ctx, {
      selector: {
        '$or': fromAdmin(ctx, false) ? adminQuery : normalUserQuery
      },
      fields: [
        'docType', 'email', 'path', 'certHash', 'authorized'
      ]
    });

    _l('FetchAll finish', query_result);

    return query_result;
  }
}

exports.contracts = [APISentryContract];
