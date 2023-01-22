const assert = require('assert');
const request = require('supertest');
const chai = require('chai');
const backend = require('../backend/bin/www');
const expect = chai.expect;
const statusCodes = require('http-status-codes');
const secrets = require('../admin/secrets.json');
const fs = require('fs');
const jsonfile = require('jsonfile');
const LOCATIONS = require('../utils/index').LOCATIONS;

const jstr = (i) => JSON.stringify(i);

const _l = i => console.log(jstr(i));

describe('ping', function() {
  it('should ping', async() => {
    await request(backend)
      .get('/ping')
      .expect(200);
  });
});

const client1 = 'customer1@org1.com';
const client2 = 'customer2@org1.com';
const admin1 = 'staff1@org2.com';
const admin2 = 'staff2@org2.com';

const ENDPOINT_1 = '/hello1';
const ENDPOINT_2 = '/hello2';

let client1_wallet, client2_wallet, admin1_wallet, admin2_wallet;

describe('full-suite', function() {
  before(async() => {
    if (fs.existsSync(`${__dirname}/wallets.json`)) {
      const wallets = require(`${__dirname}/wallets.json`);
      client1_wallet = wallets[client1];
      client2_wallet = wallets[client2];
      admin1_wallet = wallets[admin1];
      admin2_wallet = wallets[admin2];
      return;
    }
    client1_wallet = await enroll(client1);
    client2_wallet = await enroll(client2);
    admin1_wallet = await enroll(admin1);
    admin2_wallet = await enroll(admin2);

    console.log(JSON.stringify(client1_wallet));

    const wallets = {};
    wallets[client1] = client1_wallet;
    wallets[client2] = client2_wallet;
    wallets[admin1] = admin1_wallet;
    wallets[admin2] = admin2_wallet;
    await jsonfile.writeFile('wallets.json', wallets);
  });

  // load test only forward

  it('should add an endpoint', async() => {
    await addEndpoint(admin1, admin1_wallet, ENDPOINT_1);
    await addEndpoint(admin1, admin1_wallet, ENDPOINT_2);
  });
  
  it('should fetchall for admin', async() => {
    const { assets } = await fetchall(admin1, admin1_wallet);

    expect(assets.users).to.have.lengthOf(4);
    expect(assets.endpoints).to.have.lengthOf(2);
    expect(assets.mappings).to.be.undefined;
  });

  it('should fetchall for client 1 (normal user)', async() => {
    const { assets } = await fetchall(client1, client1_wallet);

    expect(assets.users).to.be.undefined;
    expect(assets.endpoints).to.have.lengthOf(2);
    expect(assets.mappings).to.be.undefined;
  });

  it('should let user 1 claim access to endpoint (add mapping)', async() => {
    const { assets } = await fetchall(client1, client1_wallet);
    expect(assets.endpoints).to.have.lengthOf(2);
    await addMapping(client1, client1_wallet, assets.endpoints[0].key);
  });

  it('should fetchall for client 2 (normal user)', async() => {
    const { assets } = await fetchall(client2, client2_wallet);

    expect(assets.users).to.be.undefined;
    expect(assets.endpoints).to.have.lengthOf(2);
    expect(assets.mappings).to.be.undefined;
  });

  it('should let user 2 claim access to endpoint (add mapping)', async() => {
    const { assets } = await fetchall(client2, client2_wallet);
    expect(assets.endpoints).to.have.lengthOf(2);
    await addMapping(client2, client2_wallet, assets.endpoints[0].key);
  });

  it('should fetchall for admin', async() => {
    const { assets } = await fetchall(admin1, admin1_wallet);

    expect(assets.users).to.have.lengthOf(4);
    expect(assets.endpoints).to.have.lengthOf(2);
    expect(assets.mappings).to.have.lengthOf(2);
  });

  it('should fetchall for client 1', async() => {
    const { assets } = await fetchall(client1, client1_wallet);

    expect(assets.users).to.be.undefined;
    expect(assets.endpoints).to.have.lengthOf(2);
    expect(assets.mappings).to.have.lengthOf(1);

    const {
      email, path
    } = assets.mappings[0].value;
    expect(email).equal(client1);
    expect(path).equal(ENDPOINT_1);
  });

  it('should fetchall for client 2', async() => {
    const { assets } = await fetchall(client2, client2_wallet);

    expect(assets.users).to.be.undefined;
    expect(assets.endpoints).to.have.lengthOf(2);
    expect(assets.mappings).to.have.lengthOf(1);

    const {
      email, path
    } = assets.mappings[0].value;
    expect(email).equal(client2);
    expect(path).equal(ENDPOINT_1);
  });

  it('should forward granted endpoint', async() => {
    const { authorized } = await forward(client1, client1_wallet, ENDPOINT_1);
    expect(authorized).to.be.true;
  });

  it('should not forward ungranted endpoint', async() => {
    await no_forward(client1, client1_wallet, ENDPOINT_2);
  });

  // should revoke mapping
  
});

const CONTENT_JSON = ['Content-Type', 'application/json'];

async function enroll(email) {
  try {
    const {body: {walletContent}} = await request(backend)
      .post('/enroll')
      .set(...CONTENT_JSON)
      .send({ 
        email,
        secret: secrets[email]
      })
      .expect(200);
    return walletContent;
  } catch (err) {
    console.error(err);
    throw err;
  }  
}

async function login(email, wallet, location) {
  try {
    const {body: {walletContent}} = await request(backend)
      .post('/login')
      .set(...CONTENT_JSON)
      .send({ 
        email,
        wallet,
        timestamp: (new Date()).getTime(),
        location
      })
      .expect(200);
    return walletContent;
  } catch (err) {
    console.error(err);
    throw err;
  }  
}

async function getUser(email, wallet) {
  try {
    const {body: user} = await request(backend)
      .post('/getuser')
      .set(...CONTENT_JSON)
      .send({ email, wallet })
      .expect(200);
    return user;
  } catch (err) {
    console.error(err);
    throw err;
  }  
}

async function addEndpoint(email, wallet, path) {
  try {
    return await request(backend)
      .post('/addendpoint')
      .set(...CONTENT_JSON)
      .send({ 
        email,
        wallet,
        path
      })
      .expect(200);
  } catch (err) {
    console.error(err);
    throw err;
  }  
}

async function addMapping(email, wallet, path) {
  try {
    return await request(backend)
      .post('/addmapping')
      .set(...CONTENT_JSON)
      .send({ 
        email,
        wallet,
        path
      })
      .expect(200);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function forward(email, wallet, path) {
  try {
    const res = await request(backend)
      .post('/forward')
      .set(...CONTENT_JSON)
      .send({ 
        email,
        wallet,
        path
      })
      .expect(200);
    return res.body;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function no_forward(email, wallet, path) {
  try {
    await request(backend)
      .post('/forward')
      .set(...CONTENT_JSON)
      .send({ 
        email,
        wallet,
        path
      })
      .expect(500);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function fetchall(email, wallet) {
  try {
    const res = await request(backend)
      .post('/fetchall')
      .set(...CONTENT_JSON)
      .send({ 
        email,
        wallet
      })
      .expect(200);
    return res.body;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getHistory(email, wallet, assetKey) {
  try {
    const res = await request(backend)
      .post('/history')
      .set(...CONTENT_JSON)
      .send({
        email,
        wallet,
        assetKey
      })
      .expect(200);
    return res.body;
  } catch (err) {
    console.error(err);
    throw err;
  }
}