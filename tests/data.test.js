const assert = require('assert');
const request = require('supertest');
const chai = require('chai');
const backend = require('../backend/bin/www');
const expect = chai.expect;
const statusCodes = require('http-status-codes');
const secrets = require('../admin/secrets.json');
const fs = require('fs');
const jsonfile = require('jsonfile');
const hash = require('object-hash');

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
    wallet1 = await enroll(email1);
    wallet2 = await enroll(email2);
    const wallets = {};
    wallets[email1] = wallet1;
    wallets[email2] = wallet2;
    await jsonfile.writeFile('wallets.json', wallets);
  });
  it('should get user', async() => {
    const u1 = await getUser(email2, wallet2, hash(wallet1.credentials.certificate));
    const u2 = await getUser(email1, wallet1, hash(wallet2.credentials.certificate));
  });
  it('should add a read for each org user', async() => {
    await addRead(email1, wallet1);
    await addRead(email2, wallet2);
  });
  it('should get history', async() => {
    const reads = await getReads(email1, wallet1);
    expect(reads).to.have.lengthOf.above(0);
    const assetKey = reads[0].key;
    await getReads(email2, wallet2);

    var runNo = 0;
    if (fs.existsSync(`${__dirname}/runNo.json`)) {
      runNo = require(`${__dirname}/runNo.json`).runNo + 1;
      await jsonfile.writeFile('runNo.json', { runNo });
    } else {
      await jsonfile.writeFile('runNo.json', { runNo: 0 });
    }

    const history = await getHistory(email1, wallet1, assetKey);
    // when running the tests multiple times, there are more than 1 reads that are not sorted when queried
    expect(history[email2]).to.have.lengthOf(runNo + 1);
  });
  // throw in "provider" user --> verify who is requesting the reads  
  // user 1 submit read, provider retrieves it, user 1 should be notified that the read has been accessed
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

async function getUser(email, wallet, certHash) {
  try {
    const {body: user} = await request(backend)
      .post('/getuser')
      .set(...CONTENT_JSON)
      .send({ email, wallet, certHash })
      .expect(200);
    return user;
  } catch (err) {
    console.error(err);
    throw err;
  }  
}

async function addRead(email, wallet) {
  try {
    return await request(backend)
      .post('/addread')
      .set(...CONTENT_JSON)
      .send({ 
        email,
        wallet,
        timestamp: (new Date()).getTime(),
        readVal: 100
      })
      .expect(200);
  } catch (err) {
    console.error(err);
    throw err;
  }  
}

async function getReads(email, wallet) {
  try {
    const {body: {reads}} = await request(backend)
      .post('/getreads')
      .set(...CONTENT_JSON)
      .send({ email, wallet })
      .expect(200);
    return reads;
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