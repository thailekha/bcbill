const assert = require('assert');
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const statusCodes = require('http-status-codes');
const fs = require('fs');
const jsonfile = require('jsonfile');
const hash = require('object-hash');

const backend = require('../backend/bin/www');
const secrets = require('../admin/secrets.json');
const { stringify } = require('querystring');
const randomstring = require('randomstring');
const jstr = (i) => JSON.stringify(i);
const _l = i => console.log(jstr(i));

describe('ping', function() {
  it('should ping', async() => {
    await request(backend)
      .get('/ping')
      .expect(200);
  });
});

// describe('API Sentry backend', () => {
//   describe('/api/provider/wallet', () => {
//     it('should create a new wallet and return it to the client', async () => {
//       // Generate a random username and provider ID
//       const username = Math.random().toString(36).substring(7);
//       const providerId = Math.random().toString(36).substring(7);
//
//       // Send a POST request to the /api/provider/wallet endpoint to create a new wallet
//       const response = await request(backend)
//           .post('/api/provider/wallet')
//           .send({
//             username: username,
//             providerId: providerId,
//           })
//           .expect(201);
//
//       // Check that the response data is not empty
//       assert.ok(response.body);
//
//       // Check that the response data is a valid Fabric wallet JSON
//       const wallet = response.body.wallet;
//       assert.ok(wallet.credentials);
//       assert.ok(wallet.credentials.certificate);
//       assert.ok(wallet.credentials.privateKey);
//       assert.ok(wallet.mspId);
//       assert.ok(wallet.type);
//       assert.strictEqual(wallet.type, 'X.509');
//     });
//
//     // it('should return an error if the username or provider ID is invalid', async () => {
//     //   // Send a POST request to the /api/provider/wallet endpoint with an invalid username and provider ID
//     //   const response = await request(backend)
//     //       .post('/api/provider/wallet')
//     //       .send({
//     //         username: 'invalid-username',
//     //         providerId: 'invalid-provider-id',
//     //       })
//     //       .expect(500);
//     //
//     //   // Check that the response data is an error message
//     //   assert.strictEqual(response.text, 'Error creating wallet.');
//     // });
//   });
// });

const client1 = 'customer1@org1.com';
const client2 = 'customer2@org1.com';
const admin1 = 'admin1@org1.com';
const admin2 = 'admin2@org1.com';

const ENDPOINTS = [
  '/ping',
  '/helloworld',
  '/echo',
  '/square-of',
  '/sum',
  '/average',
];

let client1_wallet, client2_wallet, admin1_wallet, admin2_wallet;

function setupFsWallets() {
  return async () => {
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

    // console.log(JSON.stringify(client1_wallet));

    const wallets = {};
    wallets[client1] = client1_wallet;
    wallets[client2] = client2_wallet;
    wallets[admin1] = admin1_wallet;
    wallets[admin2] = admin2_wallet;
    await jsonfile.writeFile('wallets.json', wallets);
  };
}

describe('ping-contract', function() {
  before(setupFsWallets());
  it('should ping contract', async() => {
    await pingcontract(admin1, admin1_wallet, randomstring.generate());
  });
});

describe('full-suite', function() {
  before(setupFsWallets());

  it('should register some more users', async() => {
    const w = await register(`${randomstring.generate()}@org1.com`);
    await register(`${randomstring.generate()}@org1.com`);
    await register(`${randomstring.generate()}@org1.com`);
    console.log(w);
  });

  it('should add endpoints', async() => {
    await addEndpoints(admin1, admin1_wallet, ENDPOINTS);
  });
  
  it('should fetchall for admin', async() => {
    const { assets } = await fetchall(admin1, admin1_wallet);

    expect(assets.users).to.have.lengthOf(4);
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
    const { assets } = await fetchall(admin1, admin1_wallet);

    expect(assets.users).to.have.lengthOf(4);
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
    await revoke(admin1, admin1_wallet, hash(client1_wallet.credentials.certificate), ENDPOINTS[0]);
  });

  it('should not forward revoked endpoint', async() => {
    await pingProtected(client1, client1_wallet, ENDPOINTS[0], 500);
  });

  it('should reennable mapping', async() => {
    await reenable(admin1, admin1_wallet, hash(client1_wallet.credentials.certificate), ENDPOINTS[0]);
  });

  it('should forward reenabled endpoint', async() => {
    await pingProtected(client1, client1_wallet, ENDPOINTS[0], 200);
  });
});

describe('setup-for-dev', function() {
  before(setupFsWallets());

  it('should add endpoints', async() => {
    await addEndpoints(admin1, admin1_wallet, ENDPOINTS);
  });

  it('should fetchall for admin', async() => {
    const { assets } = await fetchall(admin1, admin1_wallet);

    expect(assets.users).to.have.lengthOf(4);
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

async function addEndpoints(user, wallet) {
  for(const e of ENDPOINTS) {
    await addEndpoint(user, wallet, e);
  }
}

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

async function register(email) {
  try {
    const {body: {walletContent}} = await request(backend)
      .post('/register')
      .set(...CONTENT_JSON)
      .send({
        email
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

async function revoke(email, wallet, clientCertHash, path) {
  try {
    return await request(backend)
      .post('/revoke')
      .set(...CONTENT_JSON)
      .send({ 
        email,
        wallet,
        clientCertHash,
        path
      })
      .expect(200);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function reenable(email, wallet, clientCertHash, path) {
  try {
    return await request(backend)
      .post('/reenable')
      .set(...CONTENT_JSON)
      .send({ 
        email,
        wallet,
        clientCertHash,
        path
      })
      .expect(200);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function pingProtected(email, wallet, path, expectCode) {
  try {
    const res = await request(backend)
      .get('/protected' + path)
      .set({
        auth: JSON.stringify({email, wallet})
      })
      .expect(expectCode);
    return res.body;
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

async function pingcontract(email, wallet, text) {
  try {
    const res = await request(backend)
      .post('/pingcontract')
      .set(...CONTENT_JSON)
      .send({
        email,
        wallet,
        text
      })
      .expect(200);
    return res.body;
  } catch (err) {
    console.error(err);
    throw err;
  }
}