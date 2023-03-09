const chai = require('chai');
const expect = chai.expect;
const hash = require('object-hash');
const backend = require('../backend/bin/www');
const { stringify } = require('querystring');
const randomstring = require('randomstring');
const jstr = (i) => JSON.stringify(i);
const _l = i => console.log(jstr(i));
const foo = i => JSON.parse(JSON.stringify(i));

const {
  ORIGIN_SERVER_HOST,
  ENDPOINTS,
  AddEndpoints,
  register,
  AddOriginServer,
  AddEndpoint,
  FetchAll,
  Approve,
  AddEndpointAccessGrant,
  GetEndpointAccessGrant,
  Revoke,
  Enable,
  pingOriginServer
} = require('./assert_requests')(backend);

function makeEmail(pre) {
  return `${pre}_${randomstring.generate()}@org1.com`;
}

describe('full-suite', function() {
  const client1 = makeEmail('client');
  const client2 = makeEmail('client');
  const provider1 = makeEmail('provider');
  let client1_wallet, client2_wallet, provider1_wallet;
  let grant1;

  before(async function() {
    client1_wallet = await register(client1);
    // client2_wallet = await register(client2);
    provider1_wallet = await register(provider1);
  });

  it('should add origin server', async() => {
    await AddOriginServer(provider1, provider1_wallet);
  });

  it('should add endpoints', async() => {
    await AddEndpoints(provider1, provider1_wallet);
  });

  // MINIMAL INFO NEEDED TO grant access and test forward case
  /*
      client login
      -> select provider
      -> select origin servers (APIs)
      -> select path + verb
   */

  it('client should request access', async() => {
    // Client request access
    const {result: fetch} = await FetchAll(client1, client1_wallet, provider1);
    expect(fetch.Endpoints).to.have.lengthOf(ENDPOINTS.length);
    const { providerEmail, host, path, verb } = fetch.Endpoints[0];
    grant1 = await AddEndpointAccessGrant(client1, client1_wallet, providerEmail, host, path, verb, client1);
  });
  it('provider should approve access', async() => {
    // Provider approves
    const {result: fetch} = await FetchAll(client1, client1_wallet, provider1);
    expect(fetch.EndpointAccessGrants).to.have.lengthOf(1);
    expect(fetch.EndpointAccessGrants[0]).to.deep.equal(grant1);
    const eag = await Approve(provider1, provider1_wallet, fetch.EndpointAccessGrants[0].id);
    expect(eag.approvedBy).to.be.equal(provider1);
    grant1 = eag;
  });

  it('client should ping origin server', async() => {
    const {result: fetch} = await FetchAll(client1, client1_wallet, provider1);
    expect(fetch.EndpointAccessGrants).to.have.lengthOf(1);
    expect(fetch.EndpointAccessGrants[0]).to.deep.equal(grant1);
    await pingOriginServer(client1, client1_wallet, fetch.EndpointAccessGrants[0].id);
  });
  
  // it('should fetchall for admin', async() => {
  //   const { assets } = await fetchall(provider1, provider1_wallet);
  //
  //   expect(assets.users).to.have.lengthOf(3);
  //   expect(assets.endpoints).to.have.lengthOf(ENDPOINTS.length);
  //   expect(assets.mappings).to.be.undefined;
  // });
  //
  // it('should let user 1 claim access to endpoint (add mapping)', async() => {
  //   const { assets } = await fetchall(client1, client1_wallet);
  //
  //   expect(assets.users).to.be.undefined;
  //   expect(assets.endpoints).to.have.lengthOf(ENDPOINTS.length);
  //   expect(assets.mappings).to.be.undefined;
  //
  //   await addMapping(client1, client1_wallet, ENDPOINTS[0]);
  // });
  //
  // it('should let user 2 claim access to endpoint (add mapping)', async() => {
  //   const { assets } = await fetchall(client2, client2_wallet);
  //
  //   expect(assets.users).to.be.undefined;
  //   expect(assets.endpoints).to.have.lengthOf(ENDPOINTS.length);
  //   expect(assets.mappings).to.be.undefined;
  //
  //   await addMapping(client2, client2_wallet, ENDPOINTS[1]);
  // });
  //
  // it('should fetchall for admin', async() => {
  //   const { assets } = await fetchall(provider1, provider1_wallet);
  //
  //   expect(assets.users).to.have.lengthOf(3);
  //   expect(assets.endpoints).to.have.lengthOf(ENDPOINTS.length);
  //   expect(assets.mappings).to.have.lengthOf(2);
  // });
  //
  // it('should forward granted endpoint', async() => {
  //   await pingProtected(client1, client1_wallet, ENDPOINTS[0], 200);
  // });
  //
  // it('should not forward ungranted endpoint', async() => {
  //   await pingProtected(client1, client1_wallet, ENDPOINTS[1], 500);
  // });
  //
  // it('should revoke mapping', async() => {
  //   await revoke(provider1, provider1_wallet, hash(client1_wallet.credentials.certificate), ENDPOINTS[0]);
  // });
  //
  // it('should not forward revoked endpoint', async() => {
  //   await pingProtected(client1, client1_wallet, ENDPOINTS[0], 500);
  // });
  //
  // it('should reennable mapping', async() => {
  //   await reenable(provider1, provider1_wallet, hash(client1_wallet.credentials.certificate), ENDPOINTS[0]);
  // });
  //
  // it('should forward reenabled endpoint', async() => {
  //   await pingProtected(client1, client1_wallet, ENDPOINTS[0], 200);
  // });
});

describe('setup-for-dev', function() {
  const client1 = 'client1@org1.com';
  const client2 = 'client2@org1.com';
  const provider1 = 'provider@org1.com';
  let client1_wallet, client2_wallet, provider1_wallet;

  before(async function() {
    client1_wallet = await register(client1);
    client2_wallet = await register(client2);
    provider1_wallet = await register(provider1);
  });

  it('should add endpoints', async() => {
    await addEndpoints(provider1, provider1_wallet, ENDPOINTS);
  });

  it('should fetchall for admin', async() => {
    const { assets } = await fetchall(provider1, provider1_wallet);

    expect(assets.users).to.have.lengthOf(3);
    expect(assets.endpoints).to.have.lengthOf(ENDPOINTS.length);
    expect(assets.mappings).to.be.undefined;
  });

  it('should fetchall for client 2', async() => {
    const { assets } = await fetchall(client2, client2_wallet);

    expect(assets.users).to.be.undefined;
    expect(assets.endpoints).to.have.lengthOf(ENDPOINTS.length);
    expect(assets.mappings).to.be.undefined;

    // const {
    //   email, path
    // } = assets.mappings[0].value;
    // expect(email).equal(client2);
    // expect(path).equal(ENDPOINTS[0]);
  });

  // it('should let user 1 claim access to endpoint (add mapping)', async() => {
  //   await addMapping(client1, client1_wallet, ENDPOINTS[0]);
  //   await addMapping(client1, client1_wallet, ENDPOINTS[2]);
  //   await addMapping(client1, client1_wallet, ENDPOINTS[4]);
  //
  //   console.log(`Added ${ENDPOINTS[0]}, ${ENDPOINTS[2]}, ${ENDPOINTS[4]}`);
  // });
});

