const {Contract} = require('fabric-contract-api');
const _l = require('./lib/logger');
const { Client, DOCTYPE: CLIENT_DOCTYPE} = require('./models/Client');
const { ApiProvider, DOCTYPE: API_PROVIDER_DOCTYPE} = require('./models/ApiProvider');
const { OriginServer, DOCTYPE: ORIGIN_SERVER_DOCTYPE} = require('./models/OriginServer');
const { Endpoint, DOCTYPE: ENDPOINT_DOCTYPE}   = require('./models/Endpoint');
const { EndpointAccessGrant, DOCTYPE: ENDPOINT_ACCESS_GRANT_DOCTYPE}  = require('./models/EndpointAccessGrant');
const {query} = require('./lib/couchDbController');
const {fromClient, fromProvider, parseEntityID} = require('./lib/contract-utils');

class APISentryContract extends Contract {
  async AddClient(ctx, entityID) {
    const client = new Client(ctx, entityID);
    await client.create();
    return client.getCopy();
  }

  async AddProvider(ctx, entityID) {
    const provider = new ApiProvider(ctx, entityID);
    await provider.create();
    return provider.getCopy();
  }

  async GetUser(ctx) {
    const entityID = parseEntityID(ctx);
    const user = fromProvider(ctx, false) ? await ApiProvider.getById(ctx, entityID) : await Client.getById(ctx, entityID);
    return user.getCopy();
  }

  async AddOriginServer(ctx, providerEntityID, serverName, host) {
    const originServer = new OriginServer(ctx, providerEntityID, serverName, host);
    await originServer.create();
    return originServer.getCopy();
  }

  async AddEndpoint(ctx, originServerId, path, verb) {
    const endpoint = new Endpoint(ctx, originServerId, path, verb);
    await endpoint.create();
    return endpoint.getCopy();
  }

  async AddEndpointAccessGrant(ctx, endpointId) {
    const eag = new EndpointAccessGrant(ctx, endpointId, parseEntityID(ctx));
    await eag.create();
    return eag.getCopy();
  }

  async GetEndpointAccessGrant(ctx, endpointAccessGrantId) {
    const eag = await EndpointAccessGrant.getById(ctx, endpointAccessGrantId);
    return eag.getCopy();
  }

  async ShareAccess(ctx, endpointAccessGrantId, otherClientEntityID) {
    const eag = await EndpointAccessGrant.getById(ctx, endpointAccessGrantId);
    eag.shareWith(otherClientEntityID);
    await eag.update();
    return eag.getCopy();
  }

  async Approve(ctx, endpointAccessGrantId) {
    const eag = await EndpointAccessGrant.getById(ctx, endpointAccessGrantId);
    await eag.approve();
    return eag.getCopy();
  }

  async Revoke(ctx, endpointAccessGrantId) {
    const eag = await EndpointAccessGrant.getByIdForProvider(ctx, endpointAccessGrantId);
    eag.value.revoked = true;
    await eag.update();
    return eag.getCopy();
  }

  async Enable(ctx, endpointAccessGrantId) {
    const eag = await EndpointAccessGrant.getByIdForProvider(ctx, endpointAccessGrantId);
    eag.value.limit = 5;
    eag.value.revoked = false;
    await eag.update();
    return eag.getCopy();
  }

  async GetOriginServerInfo(ctx, endpointAccessGrantId) {
    // _l('GetOriginServerInfo start');
    const endpointAccessGrant = await EndpointAccessGrant.getById(ctx, endpointAccessGrantId);
    // _l('GetOriginServerInfo finish');
    return endpointAccessGrant.getOriginServerInfo();
  }

  async GetOriginServerInfoLimited(ctx, endpointAccessGrantId) {
    _l('GetOriginServerInfoLimited start');
    const endpointAccessGrant = await EndpointAccessGrant.getById(ctx, endpointAccessGrantId);
    await endpointAccessGrant.decreaseLimit();
    _l('GetOriginServerInfoLimited finish');
    return endpointAccessGrant.getOriginServerInfo();
  }

  /*
    provider: can access all users, endpoints, mappings
    normal user org1: can access all endpoints and there own mapping

    provider can revoke user's mapping
    user can just grab a mapping after signing up
  */
  // https://docs.couchdb.org/en/3.2.2/api/database/find.html#find-selectors
  /*
      All fields:
      entityID
      originServerId
      path
      verb
      endpointId
      clientEntityID
      requestedBy
      approvedBy
      clientIds
      limit
      revoked
      providerEntityID
      serverName
      host
   */
  async ClientHomepageData(ctx) {
    // throw error if not client
    fromClient(ctx);
    _l('ClientHomepageData start');
    // sort: [{ time: 'asc' }]
    // what to hide: originServer host, eag that is not of requester
    // fields: [  "entityID", "originServerId", "path", "verb", "endpointId", "clientEntityID", "requestedBy", "approvedBy", "clientIds", "limit", "revoked", "providerEntityID", "serverName" ]
    const query_result = await query(ctx, {
      selector: {
        $or: [
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
            requestedBy: parseEntityID(ctx)
          },
        ]
      }
    });
    _l('ClientHomepageData finish', query_result);
    return query_result;
  }

  async ApiProviderHomepageData(ctx) {
    // throw error if not
    fromProvider(ctx);
    _l('ApiProviderHomepageData start');
    const query_result = await query(ctx, {
      selector: {
        $or: [
          {
            docType: ORIGIN_SERVER_DOCTYPE,
            providerEntityID: parseEntityID(ctx)
          },
          {
            docType: ENDPOINT_DOCTYPE
          },
          {
            docType: ENDPOINT_ACCESS_GRANT_DOCTYPE
          },
        ]
      }
    });
    _l('ApiProviderHomepageData finish', query_result);
    return query_result;
  }
}

exports.contracts = [APISentryContract];
