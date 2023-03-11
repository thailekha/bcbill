const request = require('supertest');

const CONTENT_JSON = ['Content-Type', 'application/json'];
const ORIGIN_SERVERS = [
  ['math', 'http://localhost:9998']
];
const ENDPOINTS = [
  ['ping', 'get',],
  [  'helloworld','get',],
  [  'echo', 'post',],
  [  'square-of', 'post',],
  [  'sum', 'post',],
  [  'average', 'post',],
];

module.exports = (backend) => {

  async function AddEndpoints(email, wallet, originServerId) {
    const added = [];
    for(const [ path, verb ] of ENDPOINTS) {
      added.push(await AddEndpoint(email, wallet, originServerId, path, verb));
    }
    return added;
  }

  async function register(email, isProvider) {
    try {
      const {body: {walletContent}} = await request(backend)
        .post('/api/register')
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

  async function GetUser(email, wallet) {
    try {
      return (await request(backend)
        .post('/api/GetUser')
        .set(...CONTENT_JSON)
        .send({
          email,
          wallet
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function AddOriginServer(email, wallet) {
    try {
      return (await request(backend)
        .post('/api/AddOriginServer')
        .set(...CONTENT_JSON)
        .send({
          email,
          wallet,
          serverName: ORIGIN_SERVERS[0][0],
          host: ORIGIN_SERVERS[0][1]
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function AddEndpoint(email, wallet, originServerId, path, verb) {
    try {
      return (await request(backend)
        .post('/api/AddEndpoint')
        .set(...CONTENT_JSON)
        .send({
          email,
          wallet,
          originServerId,
          path,
          verb
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function AddEndpointAccessGrant(email, wallet, endpointId, clientEmail) {
    try {
      return (await request(backend)
        .post('/api/AddEndpointAccessGrant')
        .set(...CONTENT_JSON)
        .send({
          email,
          wallet,
          endpointId,
          clientEmail
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function GetEndpointAccessGrant(email, wallet, endpointAccessGrantId) {
    try {
      return (await request(backend)
        .post('/api/GetEndpointAccessGrant')
        .set(...CONTENT_JSON)
        .send({
          email,
          wallet,
          endpointAccessGrantId
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function ShareAccess(email, wallet, endpointAccessGrantId, otherClientEmail) {
    try {
      return (await request(backend)
        .post('/api/ShareAccess')
        .set(...CONTENT_JSON)
        .send({
          email,
          wallet,
          endpointAccessGrantId,
          otherClientEmail
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function ClientHomepageData(email, wallet) {
    try {
      return (await request(backend)
        .post('/api/ClientHomepageData')
        .set(...CONTENT_JSON)
        .send({
          email,
          wallet
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function Approve(email, wallet, endpointAccessGrantId) {
    try {
      return (await request(backend)
        .post('/api/Approve')
        .set(...CONTENT_JSON)
        .send({
          email,
          wallet,
          endpointAccessGrantId
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function Revoke(email, wallet, endpointAccessGrantId) {
    try {
      return (await request(backend)
        .post('/api/Revoke')
        .set(...CONTENT_JSON)
        .send({
          email,
          wallet,
          endpointAccessGrantId
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function Enable(email, wallet, endpointAccessGrantId) {
    try {
      return (await request(backend)
        .post('/api/Enable')
        .set(...CONTENT_JSON)
        .send({
          email,
          wallet,
          endpointAccessGrantId
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function pingOriginServer(email, wallet, endpointAccessGrantId) {
    try {
      await request(backend)
        .get('/api/origin-server/math/ping')
        .set({
          auth: JSON.stringify({email, wallet, endpointAccessGrantId})
        })
        .expect(200);
    } catch (err) {
      throw err;
    }
  }

  async function pingOriginServerFail(email, wallet, endpointAccessGrantId) {
    try {
      await request(backend)
        .get('/api/origin-server/math/ping')
        .set({
          auth: JSON.stringify({email, wallet, endpointAccessGrantId})
        })
        .expect(401);
    } catch (err) {
      throw err;
    }
  }

  return {
    ORIGIN_SERVER_HOST: ORIGIN_SERVERS,
    ENDPOINTS,
    GetUser,
    AddEndpoints,
    register,
    AddOriginServer,
    AddEndpoint,
    ClientHomepageData,
    AddEndpointAccessGrant,
    GetEndpointAccessGrant,
    ShareAccess,
    Approve,
    Revoke,
    Enable,
    pingOriginServer,
    pingOriginServerFail
  };
};

