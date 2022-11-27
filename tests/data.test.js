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

describe('ping', function() {
  it('should ping', async() => {
    await request(backend)
      .get('/ping')
      .expect(200);
  });
});

const customer1 = 'customer1@org1.com';
const customer2 = 'customer2@org1.com';
const staff1 = 'staff1@org2.com';
const staff2 = 'staff2@org2.com';
let customer1_wallet, customer2_wallet, staff1_wallet, staff2_wallet;

describe('full-suite', function() {
  before(async() => {
    if (fs.existsSync(`${__dirname}/wallets.json`)) {
      const wallets = require(`${__dirname}/wallets.json`);
      customer1_wallet = wallets[customer1];
      customer2_wallet = wallets[customer2];
      staff1_wallet = wallets[staff1];
      staff2_wallet = wallets[staff2];
      return;
    }
    customer1_wallet = await enroll(customer1);
    customer2_wallet = await enroll(customer2);
    staff1_wallet = await enroll(staff1);
    staff2_wallet = await enroll(staff2);

    console.log(JSON.stringify(customer1_wallet));

    const wallets = {};
    wallets[customer1] = customer1_wallet;
    wallets[customer2] = customer2_wallet;
    wallets[staff1] = staff1_wallet;
    wallets[staff2] = staff2_wallet;
    await jsonfile.writeFile('wallets.json', wallets);
  });
  it('should login', async() => {
    await login(staff1, staff1_wallet, LOCATIONS.SASKATOON);
    await login(staff2, staff2_wallet, LOCATIONS.GERMANY);
    // notice that getReads can work without even logging in --> staff2 used to have empty logins records but still has access records
  });
  // for some reasons staff2 had 3 login records. Add a test to retrieve use object to double check this
  // it's because running the tests multiple times
  it('should add a read for customers', async() => {
    await addRead(customer1, customer1_wallet);
    await addRead(customer2, customer2_wallet);
  });
  it('customer1 can access his reads', async() => {
    expect(await getReads(customer1, customer1_wallet)).to.have.lengthOf(1);
  });
  it('customer2 can access his reads', async() => {
    expect(await getReads(customer2, customer2_wallet)).to.have.lengthOf(1);
  });
  it('providers can access all reads', async() => {
    expect(await getReads(staff1, staff1_wallet)).to.have.lengthOf(2);
    expect(await getReads(staff2, staff2_wallet)).to.have.lengthOf(2);


    expect(await getReads(staff2, staff2_wallet)).to.have.lengthOf(2);
  });
  it('provider can access all a read item', async() => {
    const reads = await getReads(staff1, staff1_wallet);
    const read = await getRead(staff1, staff1_wallet, reads[0].key);
    expect(reads[0].value).to.deep.equal(read);
  });
  it('should get history of an asset', async() => {
    const reads = await getReads(customer1, customer1_wallet);
    expect(reads).to.have.lengthOf.above(0);
    const assetKey = reads[0].key;

    var runNo = 0;
    if (fs.existsSync(`${__dirname}/runNo.json`)) {
      runNo = require(`${__dirname}/runNo.json`).runNo + 1;
      await jsonfile.writeFile('runNo.json', { runNo });
    } else {
      await jsonfile.writeFile('runNo.json', { runNo: 0 });
    }

    // when running the tests multiple times, there are more than 1 reads that are not sorted when queried
    const history = await getHistory(customer1, customer1_wallet, assetKey);

    // this means the provider has accessed the asset of customer 1
    console.log(history);
    // expect(history[staff1]).to.have.lengthOf(1 + runNo);
    // expect(history[staff2]).to.have.lengthOf(1 + runNo);

    expect(history[staff1]).to.have.lengthOf(1);
    expect(history[staff2]).to.have.lengthOf(2);
  });

  /*
  a history record looks like this
  {
    'staff1@org2.com': [
      {
        timestamp: '2022-11-23T07:50:30.954Z',
        location: '52.146973,-106.647034'
      }
    ],
    'staff2@org2.com': [
      {
        timestamp: '2022-11-23T07:50:33.121Z',
        location: '52.51666667,13.4'
      },
      {
        timestamp: '2022-11-23T07:50:35.260Z',
        location: '52.51666667,13.4'
      }
    ]
  }

  
  aggragate history records of all assets to make a full report and render on map
  */
  

  // history cases:
  // - 1 login at sask -> each asset show sask in history
  // - 1 login at sask then 1 login at russia -> each asset show sask and moscow
  
  // TODO: generate multiple suites for load testing?

  // login UI: just ask user to drag n drop the wallet file

  // how to add location?
  // when provider access the reads, the customers can know the time and location of those accesses
  // store a squence of logins (time + geolocation) --> how to query with the time though?
  // make a "login" endpoint that takes timestamp and geolocation, store all logins in user object
  // when querying the history,
  
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

async function getRead(email, wallet, assetKey) {
  try {
    const {body: {read}} = await request(backend)
      .post('/getread')
      .set(...CONTENT_JSON)
      .send({ email, wallet, assetKey })
      .expect(200);
    return read;
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