const chai = require('chai');
const expect = chai.expect;
const hash = require('object-hash');
const backend = require('../backend/bin/www');
const { stringify } = require('querystring');
const randomstring = require('randomstring');
const jstr = (i) => JSON.stringify(i);
const _l = i => console.log(jstr(i));

const {
  addEndpoints,
  register,
  addMapping,
  revoke,
  reenable,
  pingProtected,
  fetchall,
} = require('./assert_requests')(backend);

const ENDPOINTS = [
  '/ping',
  '/helloworld',
  '/echo',
  '/square-of',
  '/sum',
  '/average',
];

function makeEmail(pre) {
  return `${pre}_${randomstring.generate()}@org1.com`;
}

describe('full-suite', function() {
  const client1 = makeEmail('client');
  const client2 = makeEmail('client');
  const provider1 = makeEmail('provider');
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

  it('should let user 1 claim access to endpoint (add mapping)', async() => {
    const { assets } = await fetchall(client1, client1_wallet);

    expect(assets.users).to.be.undefined;
    expect(assets.endpoints).to.have.lengthOf(ENDPOINTS.length);
    expect(assets.mappings).to.be.undefined;

    await addMapping(client1, client1_wallet, ENDPOINTS[0]);
  });

  it('should let user 2 claim access to endpoint (add mapping)', async() => {
    const { assets } = await fetchall(client2, client2_wallet);

    expect(assets.users).to.be.undefined;
    expect(assets.endpoints).to.have.lengthOf(ENDPOINTS.length);
    expect(assets.mappings).to.be.undefined;

    await addMapping(client2, client2_wallet, ENDPOINTS[1]);
  });

  it('should fetchall for admin', async() => {
    const { assets } = await fetchall(provider1, provider1_wallet);

    expect(assets.users).to.have.lengthOf(3);
    expect(assets.endpoints).to.have.lengthOf(ENDPOINTS.length);
    expect(assets.mappings).to.have.lengthOf(2);
  });

  it('should forward granted endpoint', async() => {
    await pingProtected(client1, client1_wallet, ENDPOINTS[0], 200);
  });

  it('should not forward ungranted endpoint', async() => {
    await pingProtected(client1, client1_wallet, ENDPOINTS[1], 500);
  });

  it('should revoke mapping', async() => {
    await revoke(provider1, provider1_wallet, hash(client1_wallet.credentials.certificate), ENDPOINTS[0]);
  });

  it('should not forward revoked endpoint', async() => {
    await pingProtected(client1, client1_wallet, ENDPOINTS[0], 500);
  });

  it('should reennable mapping', async() => {
    await reenable(provider1, provider1_wallet, hash(client1_wallet.credentials.certificate), ENDPOINTS[0]);
  });

  it('should forward reenabled endpoint', async() => {
    await pingProtected(client1, client1_wallet, ENDPOINTS[0], 200);
  });
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

