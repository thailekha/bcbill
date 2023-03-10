const {Contract, Asset} = require('fabric-contract-api');
const _l = require('./lib/logger');
const { Client, DOCTYPE: CLIENT_DOCTYPE} = require('./models/Client');
const { ApiProvider, DOCTYPE: API_PROVIDER_DOCTYPE} = require('./models/ApiProvider');
const { OriginServer, DOCTYPE: ORIGIN_SERVER_DOCTYPE} = require('./models/OriginServer');
const { Endpoint, DOCTYPE: ENDPOINT_DOCTYPE}   = require('./models/Endpoint');
const { EndpointAccessGrant, DOCTYPE: ENDPOINT_ACCESS_GRANT_DOCTYPE}  = require('./models/EndpointAccessGrant');
const {query} = require('./lib/couchDbController');
const {fromProvider, parseEmail} = require('./lib/contract-utils');

class APISentryContract extends Contract {
  async AddClient(ctx, email) {
    const client = new Client(ctx, email);
    await client.create();
    return client.getCopy();
  }

  async AddProvider(ctx, email) {
    const provider = new ApiProvider(ctx, email);
    await provider.create();
    return provider.getCopy();
  }

  async AddOriginServer(ctx, providerEmail, serverName, host) {
    const originServer = new OriginServer(ctx, providerEmail, serverName, host);
    await originServer.create();
    return originServer.getCopy();
  }

  async AddEndpoint(ctx, originServerId, path, verb) {
    const endpoint = new Endpoint(ctx, originServerId, path, verb);
    await endpoint.create();
    return endpoint.getCopy();
  }

  async AddEndpointAccessGrant(ctx, endpointId, clientEmail) {
    const grant = new EndpointAccessGrant(ctx, endpointId, clientEmail);
    await grant.create();
    return grant.getCopy();
  }

  async GetEndpointAccessGrant(ctx, endpointAccessGrantId) {
    const grant = await EndpointAccessGrant.getById(ctx, endpointAccessGrantId);
    return grant.getCopy();
  }

  async Approve(ctx, endpointAccessGrantId) {
    const grant = await EndpointAccessGrant.getById(ctx, endpointAccessGrantId);
    await grant.approve();
    return grant.getCopy();
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

  async GetOriginServerInfo(ctx, endpointAccessGrantId) {
    _l('GetOriginServerInfo start');
    const endpointAccessGrant = await EndpointAccessGrant.getById(ctx, endpointAccessGrantId);
    _l('GetOriginServerInfo finish');
    return endpointAccessGrant.processProxyRequest(parseEmail(ctx));
  }

  /*
    provider: can access all users, endpoints, mappings
    normal user org1: can access all endpoints and there own mapping

    provider can revoke user's mapping
    user can just grab a mapping after signing up
  */
  // https://docs.couchdb.org/en/3.2.2/api/database/find.html#find-selectors
  // fields: [  "email",  "providerEmail",  "host",  "path",  "verb",  "clientEmail",  "requestedBy",  "approvedBy",  "clientIds",  "limit",  "revoked" ]
  async FetchAll(ctx, providerEmail) {
    _l('FetchAll start');
    // sort: [{ time: 'asc' }]
    const query_result = await query(ctx, {
      selector: {
        $or: [
          {
            docType: 'Endpoint',
            providerEmail: providerEmail
          },
          {
            docType: 'EndpointAccessGrant',
            providerEmail: providerEmail
          }
        ]
      }
    });
    _l('FetchAll finish', query_result);
    return query_result;
  }
}

exports.contracts = [APISentryContract];
