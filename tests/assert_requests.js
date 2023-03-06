const request = require('supertest');

const CONTENT_JSON = ['Content-Type', 'application/json'];
const ENDPOINTS = [
  '/ping',
  '/helloworld',
  '/echo',
  '/square-of',
  '/sum',
  '/average',
];

module.exports = (backend) => {

  async function addEndpoints(user, wallet) {
    for(const e of ENDPOINTS) {
      await addEndpoint(user, wallet, e);
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

  return {
    addEndpoints,
    register,
    login,
    getUser,
    addEndpoint,
    addMapping,
    revoke,
    reenable,
    pingProtected,
    fetchall,
    getHistory
  };
};

