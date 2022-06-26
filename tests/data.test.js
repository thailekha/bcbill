const assert = require('assert');
const request = require('supertest');
const chai = require('chai');
const backend = require('../backend/bin/www');
const expect = chai.expect;
const statusCodes = require('http-status-codes');
const secrets = require('../admin/secrets.json');

describe('ping', function() {
  it('should ping', async() => {
    await request(backend)
      .get('/ping')
      .expect(200);
  });
});

describe('user-management', function() {
  // enroll, get wallet
  // test all endpoints
  it('should enroll users', async() => {
    const email1 = 'customer1@org1.com';
    const email2 = 'customer2@org2.com';
    const {body: {walletContent: wallet1}} = await request(backend)
      .post('/enroll')
      .set('Content-Type', 'application/json')
      .send({ 
        email: email1,
        secret: secrets[email1]
      })
      .expect(200);

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
});