const assert = require('assert');
const request = require('supertest');
const chai = require('chai');
const backend = require('../backend/bin/www');
const expect = chai.expect;
const statusCodes = require('http-status-codes');
const secrets = require('../admin/secrets.json');
const fs = require('fs');
const jsonfile = require('jsonfile');

describe('ping', function() {
  it('should ping', async() => {
    await request(backend)
      .get('/ping')
      .expect(200);
  });
});

const email1 = 'customer1@org1.com';
const email2 = 'customer2@org2.com';
let wallet1, wallet2;
const CONTENT_JSON = ['Content-Type', 'application/json'];

describe('full-suite', function() {
  // enroll, get wallet
  // test all endpoints
  before(async() => {
    if (fs.existsSync(`${__dirname}/wallets.json`)) {
      const wallets = require(`${__dirname}/wallets.json`);
      wallet1 = wallets[email1];
      wallet2 = wallets[email2];
      return;
    }

    const {body: {walletContent: w1}} = await request(backend)
      .post('/enroll')
      .set(...CONTENT_JSON)
      .send({ 
        email: email1,
        secret: secrets[email1]
      })
      .expect(200);    
    const {body: {walletContent: w2}} = await request(backend)
      .post('/enroll')
      .set(...CONTENT_JSON)
      .send({ 
        email: email2,
        secret: secrets[email2]
      })
      .expect(200);

    wallet1 = w1;
    wallet2 = w2;

    const wallets = {};
    wallets[email1] = wallet1;
    wallets[email2] = wallet2;
    await jsonfile.writeFile('wallets.json', wallets);
  });
  it('should add a read', async() => {
    await request(backend)
      .post('/addread')
      .set('Content-Type', 'application/json')
      .send({ 
        email: email1,
        wallet: wallet1,
        timestamp: (new Date()).getTime(),
        readVal: 100
      })
      .expect(200);
  });
  it('should add a read for each org user', async() => {
    await request(backend)
      .post('/addread')
      .set('Content-Type', 'application/json')
      .send({ 
        email: email1,
        wallet: wallet1,
        timestamp: (new Date()).getTime(),
        readVal: 100
      })
      .expect(200);
    await request(backend)
      .post('/addread')
      .set('Content-Type', 'application/json')
      .send({ 
        email: email2,
        wallet: wallet2,
        timestamp: (new Date()).getTime(),
        readVal: 100
      })
      .expect(200);
  });
  it('should indicate if a user access another user\'s read', async() => {
    const { id } = await request(backend)
      .post('/addread')
      .set('Content-Type', 'application/json')
      .send({ 
        email: email1,
        wallet: wallet1,
        timestamp: (new Date()).getTime(),
        readVal: 100
      })
      .expect(200);
    await request(backend)
      .post('/getreads')
      .set('Content-Type', 'application/json')
      .send({
        email: email2,
        wallet: wallet2,
        timestamp: (new Date()).getTime(),
        readVal: 100
      })
      .expect(200);
  });
});
