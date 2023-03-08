const request = require('supertest');

const CONTENT_JSON = ['Content-Type', 'application/json'];
const ORIGIN_SERVER_HOST = 'localhost:9998';
const ENDPOINTS = [
  ['/ping', 'get',],
  [  '/helloworld','get',],
  [  '/echo', 'post',],
  [  '/square-of', 'post',],
  [  '/sum', 'post',],
  [  '/average', 'post',],
];

module.exports = (backend) => {

  async function AddEndpoints(email, wallet) {
    for(const [ path, verb ] of ENDPOINTS) {
      await AddEndpoint(email, wallet, ORIGIN_SERVER_HOST, path, verb);
    }
  }

  async function register(email, isProvider) {
    try {
      const {body: {walletContent}} = await request(backend)
        .post('/register')
        .set(...CONTENT_JSON)
        .send({
          email,
          isProvider
        })
        .expect(200);
      return walletContent;
    } catch (err) {
      throw err;
    }
  }
  async function AddOriginServer(email, wallet) {
    try {
      await request(backend)
        .post('/AddOriginServer')
        .set(...CONTENT_JSON)
        .send({
          email,
          wallet,
          host: ORIGIN_SERVER_HOST
        })
        .expect(200);
    } catch (err) {
      throw err;
    }
  }

  async function AddEndpoint(email, wallet, host, path, verb) {
    try {
      await request(backend)
        .post('/AddEndpoint')
        .set(...CONTENT_JSON)
        .send({
          email,
          wallet,
          host,
          path,
          verb
        })
        .expect(200);
    } catch (err) {
      throw err;
    }
  }

  async function AddEndpointAccessGrant(email, wallet, providerEmail, host, path, verb, clientEmail) {
    try {
      await request(backend)
        .post('/AddEndpointAccessGrant')
        .set(...CONTENT_JSON)
        .send({
          email,
          wallet,
          providerEmail,
          host,
          path,
          verb,
          clientEmail
        })
        .expect(200);
    } catch (err) {
      throw err;
    }
  }

  async function Revoke(email, wallet, endpointAccessGrantId) {
    try {
      await request(backend)
        .post('/Revoke')
        .set(...CONTENT_JSON)
        .send({
          email,
          wallet,
          endpointAccessGrantId
        })
        .expect(200);
    } catch (err) {
      throw err;
    }
  }

  async function Enable(email, wallet, endpointAccessGrantId) {
    try {
      await request(backend)
        .post('/Enable')
        .set(...CONTENT_JSON)
        .send({
          email,
          wallet,
          endpointAccessGrantId
        })
        .expect(200);
    } catch (err) {
      throw err;
    }
  }

  return {
    AddEndpoints,
    register,
    AddOriginServer,
    AddEndpoint,
    AddEndpointAccessGrant,
    Revoke,
    Enable
  };
};

