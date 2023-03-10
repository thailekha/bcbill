const chai = require('chai');
const expect = chai.expect;
const hash = require('object-hash');
const backend = require('../backend/bin/www');
const { stringify } = require('querystring');
const randomstring = require('randomstring');
const request = require('supertest');
const jsonfile = require('jsonfile');
const jstr = (i) => JSON.stringify(i);
const _l = i => console.log(jstr(i));
const foo = i => JSON.parse(JSON.stringify(i));

const {
  ORIGIN_SERVER_HOST,
  ENDPOINTS,
  AddEndpoint,
  AddEndpoints,
  register,
  AddOriginServer,
  ClientHomepageData,
  Approve,
  AddEndpointAccessGrant,
  GetEndpointAccessGrant,
  Revoke,
  Enable,
  pingOriginServer,
  pingOriginServerFail
} = require('./assert_requests')(backend);

function makeEmail(pre) {
  return `${pre}_${randomstring.generate()}@org1.com`;
}

describe('minimal proxy case', function() {
  const client1 = makeEmail('client');
  const client2 = makeEmail('client');
  const provider1 = makeEmail('provider');
  let client1_wallet, client2_wallet, provider1_wallet;
  let server1, endpoint1, grant1;
  before(async function() {
    client1_wallet = await register(client1);
    // client2_wallet = await register(client2);
    provider1_wallet = await register(provider1);
  });
  it('should add origin server', async() => {
    server1 = await AddOriginServer(provider1, provider1_wallet);
  });
  it('should add ping endpoint', async() => {
    endpoint1 = await AddEndpoint(provider1, provider1_wallet, server1.id, ENDPOINTS[0][0], ENDPOINTS[0][1]);
  });
  it('should request access', async() => {
    // Client request access
    grant1 = await AddEndpointAccessGrant(client1, client1_wallet, endpoint1.id, client1);
  });
  it('should approve access', async() => {
    const eag = await Approve(provider1, provider1_wallet, grant1.id);
    expect(eag.approvedBy).to.be.equal(provider1);
    grant1 = eag;
  });
  it('should ping origin server', async() => {
    await pingOriginServer(client1, client1_wallet, grant1.id);
  });
  // revoke, ping, reenable, ping
  it('should revoke access', async() => {
    await Revoke(provider1, provider1_wallet, grant1.id);
  });
  it('should not ping origin server', async() => {
    await pingOriginServerFail(client1, client1_wallet, grant1.id);
  });
  it('should enable access', async() => {
    await Enable(provider1, provider1_wallet, grant1.id);
  });
  it('should ping origin server', async() => {
    await pingOriginServer(client1, client1_wallet, grant1.id);
  });
});

// Ask for edge cases like duplicates

describe('UI-suite', function() {
  const client1 = makeEmail('client');
  const client2 = makeEmail('client');
  const provider1 = makeEmail('provider');
  let client1_wallet, client2_wallet, provider1_wallet;
  let server1, endpoint1, grant1;
  before(async function() {
    client1_wallet = await register(client1);
    // client2_wallet = await register(client2);
    provider1_wallet = await register(provider1);
  });
  it('should add origin server', async() => {
    server1 = await AddOriginServer(provider1, provider1_wallet);
  });
  it('should add endpoints', async() => {
    await AddEndpoints(provider1, provider1_wallet, server1.id);
  });
  it('should fetch discovery data for client', async() => {
    const homepageData = await ClientHomepageData(provider1, provider1_wallet, server1.id);
    expect(homepageData).to.not.have.property('Client');
    expect(homepageData).to.not.have.property('EndpointAccessGrant');

    expect(homepageData.ApiProvider).to.be.an('array').that.is.not.empty;
    expect(homepageData.OriginServer).to.be.an('array').that.is.not.empty;
    expect(homepageData.Endpoint).to.be.an('array').that.is.not.empty;
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
  /*
      just fetch all providers, servers, and endpoints
      only things to hide are EAG and the actual server host
   */
  // it('client should request access', async() => {
  //   // Client request access
  //   const {result: fetch} = await ClientHomepageData(client1, client1_wallet, provider1);
  //   expect(fetch.Endpoints).to.have.lengthOf(ENDPOINTS.length);
  //   const { providerEmail, host, path, verb } = fetch.Endpoints[0];
  //   grant1 = await AddEndpointAccessGrant(client1, client1_wallet, providerEmail, host, path, verb, client1);
  // });
  // it('provider should approve access', async() => {
  //   // Provider approves
  //   const {result: fetch} = await ClientHomepageData(client1, client1_wallet, provider1);
  //   expect(fetch.EndpointAccessGrants).to.have.lengthOf(1);
  //   expect(fetch.EndpointAccessGrants[0]).to.deep.equal(grant1);
  //   const eag = await Approve(provider1, provider1_wallet, fetch.EndpointAccessGrants[0].id);
  //   expect(eag.approvedBy).to.be.equal(provider1);
  //   grant1 = eag;
  // });
  // it('client should ping origin server', async() => {
  //   const {result: fetch} = await ClientHomepageData(client1, client1_wallet, provider1);
  //   expect(fetch.EndpointAccessGrants).to.have.lengthOf(1);
  //   expect(fetch.EndpointAccessGrants[0]).to.deep.equal(grant1);
  //   await pingOriginServer(client1, client1_wallet, fetch.EndpointAccessGrants[0].id);
  // });
});


describe('setup-for-dev', function() {
  const client1 = makeEmail('client');
  const client2 = makeEmail('client');
  const provider1 = makeEmail('provider');
  let client1_wallet, client2_wallet, provider1_wallet;
  let server1, endpoint1, grant1;
  before(async function() {
    client1_wallet = await register(client1);
    // client2_wallet = await register(client2);
    provider1_wallet = await register(provider1);
  });
  it('should add origin server', async() => {
    server1 = await AddOriginServer(provider1, provider1_wallet);
  });
  it('should add endpoints', async() => {
    await AddEndpoints(provider1, provider1_wallet, server1.id);
  });
  it('should write data to file', async() => {
    jsonfile.writeFileSync('ui-data.json', {
      client1,
      client2,
      provider1,
      client1_wallet,
      client2_wallet,
      provider1_wallet
    });
  });
});

