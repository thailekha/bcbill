const {Contract, Asset} = require('fabric-contract-api');
const _l = require('./lib/logger');
const { Client, DOCTYPE: CLIENT_DOCTYPE} = require('./models/Client');
const { ApiProvider, DOCTYPE: API_PROVIDER_DOCTYPE} = require('./models/ApiProvider');
const { OriginServer, DOCTYPE: ORIGIN_SERVER_DOCTYPE} = require('./models/OriginServer');
const { Endpoint, DOCTYPE: ENDPOINT_DOCTYPE}   = require('./models/Endpoint');
const { EndpointAccessGrant, DOCTYPE: ENDPOINT_ACCESS_GRANT_DOCTYPE}  = require('./models/EndpointAccessGrant');
const {query} = require('./lib/couchDbController');
const {fromProvider} = require('./lib/contract-utils');

class APISentryContract extends Contract {
  async AddClient(ctx, email) {
    return await(new Client(ctx, email)).create();
  }

  async AddProvider(ctx, email) {
    return await(new ApiProvider(ctx, email)).create();
  }

  async AddOriginServer(ctx, providerEmail, host) {
    return await(new OriginServer(ctx, providerEmail, host)).create();
  }

  async AddEndpoint(ctx, providerEmail, host, path, verb) {
    return await(new Endpoint(ctx, providerEmail, host, path, verb)).create();
  }

  async AddEndpointAccessGrant(ctx, providerEmail, host, path, verb, clientEmail) {
    return await(new EndpointAccessGrant(ctx, providerEmail, host, path, verb, clientEmail)).create();
  }

  async Revoke(ctx, endpointAccessGrantId) {
    const endpointAccessGrant = await EndpointAccessGrant.getByIdForProvider(ctx, endpointAccessGrantId);
    endpointAccessGrant.value.revoked = true;
    await endpointAccessGrant.update();
  }

  async Enable(ctx, endpointAccessGrantId) {
    const endpointAccessGrant = await EndpointAccessGrant.getByIdForProvider(ctx, endpointAccessGrantId);
    endpointAccessGrant.value.revoked = false;
    await endpointAccessGrant.update();
  }

  async Forward(ctx, endpointAccessGrantId, clientEmail) {
    _l('Forward start');
    const endpointAccessGrant = await EndpointAccessGrant.getById(ctx, endpointAccessGrantId);
    _l('Forward finish');
    return endpointAccessGrant.canForward(clientEmail);
  }

  /*
    provider: can access all users, endpoints, mappings
    normal user org1: can access all endpoints and there own mapping

    provider can revoke user's mapping
    user can just grab a mapping after signing up
  */
  // https://docs.couchdb.org/en/3.2.2/api/database/find.html#find-selectors
  async FetchAll(ctx, certHash) {
    _l('FetchAll start');
    // sort: [{ time: 'asc' }]
    const providerQuery = [
      {
        docType: API_PROVIDER_DOCTYPE
      },
      {
        docType: CLIENT_DOCTYPE
      },
      {
        docType: ORIGIN_SERVER_DOCTYPE
      },
      {
        docType: ENDPOINT_DOCTYPE
      },
      {
        docType: ENDPOINT_ACCESS_GRANT_DOCTYPE
      },
    ];

    const clientQuery = [
      {
        docType: API_PROVIDER_DOCTYPE
      },
      {
        docType: CLIENT_DOCTYPE
      },
      {
        docType: ORIGIN_SERVER_DOCTYPE
      },
      {
        docType: ENDPOINT_DOCTYPE
      },
      {
        docType: ENDPOINT_ACCESS_GRANT_DOCTYPE,
        // certHash
      },
    ];

    const query_result = await query(ctx, {
      selector: {
        '$or': fromProvider(ctx, false) ? providerQuery : clientQuery
      },
      fields: [
        '*'
      ]
    });
    _l('FetchAll finish', query_result);
    return query_result;
  }
}

exports.contracts = [APISentryContract];
