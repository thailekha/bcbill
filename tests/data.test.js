/* global describe, before, it */

const chai = require('chai');
const expect = chai.expect;
const backend = require('../backend/index');
const randomstring = require('randomstring');
const jsonfile = require('jsonfile');

const {
  ENDPOINTS,
  GetUser,
  AddEndpoint,
  AddEndpoints,
  register,
  AddOriginServer,
  AddOriginServer2,
  ApiProviderHomepageData,
  ClientHomepageData,
  Approve,
  AddEndpointAccessGrant,
  ShareAccess,
  Revoke,
  Enable,
  pingOriginServer,
  pingOriginServerFail,
  callSampleGetOriginServer
} = require('./assert_requests')(backend);

function makeEntityID(pre) {
  return `${pre}${randomstring.generate()}`;
}

describe('minimal-proxy-case', function() {
  const client1 = makeEntityID('client');
  const client2 = makeEntityID('client');
  const provider1 = makeEntityID('provider');
  let client1_wallet, client2_wallet, provider1_wallet;
  let server1, endpoint1, grant1;
  before(async function() {
    client1_wallet = await register(client1);
    client2_wallet = await register(client2);
    provider1_wallet = await register(provider1, true);
  });
  it('should get user provider', async() => {
    const p1 = await GetUser(provider1, provider1_wallet);
    expect(p1.entityID).to.be.equal(provider1);
    expect(p1.docType).to.be.equal('ApiProvider');
  });
  it('should get user client', async() => {
    const c1 = await GetUser(client1, client1_wallet);
    expect(c1.entityID).to.be.equal(client1);
    expect(c1.docType).to.be.equal('Client');
  });
  it('should add origin server', async() => {
    server1 = await AddOriginServer(provider1, provider1_wallet);
  });
  it('should add ping endpoint', async() => {
    endpoint1 = await AddEndpoint(provider1, provider1_wallet, server1.id, ENDPOINTS[0][0], ENDPOINTS[0][1]);
  });
  it('should request access', async() => {
    // Client request access
    grant1 = await AddEndpointAccessGrant(client1, client1_wallet, endpoint1.id);
  });
  it('should approve access', async() => {
    const eag = await Approve(provider1, provider1_wallet, grant1.id);
    expect(eag.approvedBy).to.be.equal(provider1);
    grant1 = eag;
  });
  it('should share access', async() => {
    const eag = await ShareAccess(client1, client1_wallet, grant1.id, client2);
    expect(eag.clientIds).to.include(client2);
  });
  it('should ping origin server', async() => {
    await pingOriginServer(client1, client1_wallet, grant1.id);
    await pingOriginServer(client2, client2_wallet, grant1.id);
  });
  it('should revoke access', async() => {
    await Revoke(provider1, provider1_wallet, grant1.id);
  });
  it('should not ping origin server', async() => {
    await pingOriginServerFail(client1, client1_wallet, grant1.id);
    await pingOriginServerFail(client2, client2_wallet, grant1.id);
  });
  it('should enable access', async() => {
    await Enable(provider1, provider1_wallet, grant1.id);
  });
  it('should ping origin server', async() => {
    await pingOriginServer(client1, client1_wallet, grant1.id);
    await pingOriginServer(client2, client2_wallet, grant1.id);
  });
});

// Ask for edge cases like duplicates
// Test all Verbs !
// one origin server can only be of one provider

describe('UI-suite', function() {
  const clientA = makeEntityID('app1_tom');
  const clientB = makeEntityID('app2_tom');
  const providerX = makeEntityID('provider');
  const providerY = makeEntityID('provider');

  // NUMBER is endpoint
  // A or B is client
  // X or Y is provider

  let clientA_wallet, clientB_wallet, providerX_wallet, providerY_wallet;
  let serverX, serverY;
  let endpoint1X, endpoint2X, endpoint3X, endpoint4X, endpoint5X;
  let endpoint1Y, endpoint2Y, endpoint3Y, endpoint4Y, endpoint5Y;
  let grant1XA, grant2XA, grant3XA, grant4XB;
  let grant1YB, grant2YB, grant3YA;

  before(async function() {
    clientA_wallet = await register(clientA);
    clientB_wallet = await register(clientB);
    providerX_wallet = await register(providerX, true);
    providerY_wallet = await register(providerY, true);
  });
  it('should add origin server', async() => {
    serverX = await AddOriginServer(providerX, providerX_wallet);
    serverY = await AddOriginServer2(providerY, providerX_wallet);
  });
  it('should add endpoints', async() => {
    // there are actually 6 endpoints, here we just retrieve 5 for doing granting
    [endpoint1X, endpoint2X, endpoint3X, endpoint4X, endpoint5X] = await AddEndpoints(providerX, providerX_wallet, serverX.id);
    [endpoint1Y, endpoint2Y, endpoint3Y, endpoint4Y, endpoint5Y] = await AddEndpoints(providerY, providerY_wallet, serverY.id);
  });
  it('should grant', async() => {
    // e.g. endpoint 1, server X, client A
    grant1XA = await AddEndpointAccessGrant(clientA, clientA_wallet, endpoint1X.id);
    grant2XA = await AddEndpointAccessGrant(clientA, clientA_wallet, endpoint2X.id);
    grant3XA = await AddEndpointAccessGrant(clientA, clientA_wallet, endpoint3X.id);
    grant4XB = await AddEndpointAccessGrant(clientB, clientB_wallet, endpoint4X.id);
    grant1YB = await AddEndpointAccessGrant(clientB, clientB_wallet, endpoint1Y.id);
    grant2YB = await AddEndpointAccessGrant(clientB, clientB_wallet, endpoint2Y.id);
    grant3YA = await AddEndpointAccessGrant(clientA, clientA_wallet, endpoint3Y.id);
  });
  it('should approve access', async() => {
    grant1XA = await Approve(providerX, providerX_wallet, grant1XA.id);
    grant2XA = await Approve(providerX, providerX_wallet, grant2XA.id);
    grant3XA = await Approve(providerX, providerX_wallet, grant3XA.id);
    grant4XB = await Approve(providerX, providerX_wallet, grant4XB.id);
    grant1YB = await Approve(providerY, providerY_wallet, grant1YB.id);
    grant2YB = await Approve(providerY, providerY_wallet, grant2YB.id);
    grant3YA = await Approve(providerY, providerY_wallet, grant3YA.id);
    expect(grant1XA.approvedBy).to.be.equal(providerX);
    expect(grant2XA.approvedBy).to.be.equal(providerX);
    expect(grant3XA.approvedBy).to.be.equal(providerX);
    expect(grant4XB.approvedBy).to.be.equal(providerX);
    expect(grant1YB.approvedBy).to.be.equal(providerY);
    expect(grant2YB.approvedBy).to.be.equal(providerY);
    expect(grant3YA.approvedBy).to.be.equal(providerY);
  });
  it('should fetch discovery data for client', async() => {
    const homepageData = await ClientHomepageData(clientA, clientA_wallet);
    const x_provider = homepageData.ApiProviders.filter(p => p.entityID === providerX)[0];
    expect(x_provider.OriginServers).to.have.lengthOf(1);
    const x_server = x_provider.OriginServers.filter(s => s.id === serverX.id)[0];
    expect(x_server.Endpoints).to.have.lengthOf(6);
    const x1_endpoint =  x_server.Endpoints.filter(e => e.id === endpoint1X.id)[0];
    expect(x1_endpoint.EndpointAccessGrant).to.have.lengthOf(1);
    const x1_grant = x1_endpoint.EndpointAccessGrant.filter(g => g.requestedBy === clientA)[0];
    expect(x1_grant.approvedBy).to.be.equal(providerX);
  });
  it('should fetch discovery data for api provider', async() => {
    const homepageData = await ApiProviderHomepageData(providerX, providerX_wallet);
    expect(homepageData.OriginServers).to.have.lengthOf(1);
    const x_server = homepageData.OriginServers[0];
    expect(x_server.id).to.equal(serverX.id);
    expect(x_server.Endpoints).to.have.lengthOf(6);
    const x1_endpoint =  x_server.Endpoints.filter(e => e.id === endpoint1X.id)[0];
    expect(x1_endpoint.EndpointAccessGrant).to.have.lengthOf(1);
    const x1_grant = x1_endpoint.EndpointAccessGrant.filter(g => g.approvedBy === providerX)[0];
    expect(x1_grant.requestedBy).to.be.equal(clientA);
  });
  // MINIMAL INFO NEEDED TO grant access and test forward case
  /*
      client login
      -> select provider
      -> select origin servers (APIs)
      -> fetch the endpoints
      -> select endpoint
      -> select path + verb
   */
  it('should write data to file', async() => {
    jsonfile.writeFileSync('ui-data.json', {
      clientA,
      clientB,
      providerX,
      providerY,
      clientA_wallet,
      clientB_wallet,
      providerX_wallet,
      providerY_wallet,
    }, { spaces: 4 });
  });
});

describe('minimal-ui', function() {
  const clientA = 'ios-gif-gen_tom7';
  const providerX = 'provider_giphy7';

  let clientA_wallet, providerX_wallet;
  let serverX;
  let endpoint1X;
  let grant1XA;

  before(async function() {
    clientA_wallet = await register(clientA);
    providerX_wallet = await register(providerX, true);
  });
  it('should add origin server', async() => {
    serverX = await AddOriginServer(providerX, providerX_wallet);
  });
  it('should add endpoints', async() => {
    endpoint1X = await AddEndpoint(providerX, providerX_wallet, serverX.id, 'ping', 'get');
  });
  it('should fetch discovery data for client', async() => {
    const homepageData = await ClientHomepageData(clientA, clientA_wallet);
    const x_provider = homepageData.ApiProviders.filter(p => p.entityID === providerX)[0];
    expect(x_provider.OriginServers).to.have.lengthOf(1);
    const x_server = x_provider.OriginServers.filter(s => s.id === serverX.id)[0];
    expect(x_server.Endpoints).to.have.lengthOf(1);
  });
  it('should write data to file', async() => {
    jsonfile.writeFileSync('ui-data.json', {
      clientA,
      providerX,
      clientA_wallet,
      providerX_wallet,
    }, { spaces: 4 });
  });
});

describe('prepare-loadtest', function() {
  const clientA = makeEntityID('app1_tom');
  const clientB = makeEntityID('app2_tom');
  const providerX = makeEntityID('provider');
  const providerY = makeEntityID('provider');

  let clientA_wallet, clientB_wallet, providerX_wallet, providerY_wallet;
  let serverX, serverY;
  let endpoint_get;
  let endpoint_post;
  let endpoint_put;
  let endpoint_del;
  let grant_get;
  let grant_post;
  let grant_put;
  let grant_del;

  before(async function() {
    clientA_wallet = await register(clientA);
    clientB_wallet = await register(clientB);
    providerX_wallet = await register(providerX, true);
    providerY_wallet = await register(providerY, true);
  });
  it('should add origin server', async() => {
    serverX = await AddOriginServer(providerX, providerX_wallet);
    serverY = await AddOriginServer2(providerY, providerX_wallet);
  });
  it('should add endpoint', async() => {
    endpoint_get = await AddEndpoint(providerX, providerX_wallet, serverX.id, 'sample-get', 'get');
    endpoint_post = await AddEndpoint(providerX, providerX_wallet, serverX.id, 'sample-post', 'post');
    endpoint_put = await AddEndpoint(providerX, providerX_wallet, serverX.id, 'sample-put', 'put');
    endpoint_del = await AddEndpoint(providerX, providerX_wallet, serverX.id, 'sample-delete', 'delete');
  });
  it('should request access', async() => {
    // e.g. endpoint 1, server X, client A
    grant_get = await AddEndpointAccessGrant(clientA, clientA_wallet, endpoint_get.id);
    grant_post = await AddEndpointAccessGrant(clientA, clientA_wallet, endpoint_post.id);
    grant_put = await AddEndpointAccessGrant(clientA, clientA_wallet, endpoint_put.id);
    grant_del = await AddEndpointAccessGrant(clientA, clientA_wallet, endpoint_del.id);
  });
  it('should approve access', async() => {
    grant_get = await Approve(providerX, providerX_wallet, grant_get.id);
    grant_post = await Approve(providerX, providerX_wallet, grant_post.id);
    grant_put = await Approve(providerX, providerX_wallet, grant_put.id);
    grant_del = await Approve(providerX, providerX_wallet, grant_del.id);
    expect(grant_get.approvedBy).to.be.equal(providerX);
    expect(grant_post.approvedBy).to.be.equal(providerX);
    expect(grant_put.approvedBy).to.be.equal(providerX);
    expect(grant_del.approvedBy).to.be.equal(providerX);
  });
  it('should call origin server', async() => {
    await callSampleGetOriginServer(clientA, clientA_wallet, grant_get.id);
  });
  it('should write data to file', async() => {
    jsonfile.writeFileSync('./loadtest-data.json', {
      clientA,
      clientB,
      providerX,
      providerY,
      clientA_wallet,
      clientB_wallet,
      providerX_wallet,
      providerY_wallet,
      grant_get: grant_get.id,
      grant_post: grant_post.id,
      grant_put: grant_put.id,
      grant_del: grant_del.id,
    }, { spaces: 4 });
  });
});

describe('debugging', function() {
  const provider = 'catinc1';
  let providerWallet, serverX;

  before(async function() {
    providerWallet = await register(provider, true);
  });
  it('should add origin server', async() => {
    serverX = await AddOriginServer(provider, providerWallet);
    console.log();
  });
});
