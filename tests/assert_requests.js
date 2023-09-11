const request = require('supertest');

const CONTENT_JSON = ['Content-Type', 'application/json'];
const ORIGIN_SERVERS = [
  ['math', 'http://172.29.2.33:9998'],
  ['dumb', 'http://localhost:9997'],
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

  async function AddEndpoints(entityID, wallet, originServerId) {
    const added = [];
    for(const [ path, verb ] of ENDPOINTS) {
      added.push(await AddEndpoint(entityID, wallet, originServerId, path, verb));
    }
    return added;
  }

  async function register(entityID, isProvider) {
    try {
      const {body: {walletContent}} = await request(backend)
        .post('/api/register')
        .set(...CONTENT_JSON)
        .send({
          entityID,
          isProvider
        })
        .expect(200);
      return walletContent;
    } catch (err) {
      throw err;
    }
  }

  async function GetUser(entityID, wallet) {
    try {
      return (await request(backend)
        .post('/api/GetUser')
        .set(...CONTENT_JSON)
        .send({
          entityID,
          wallet
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function AddOriginServer(entityID, wallet) {
    try {
      return (await request(backend)
        .post('/api/AddOriginServer')
        .set(...CONTENT_JSON)
        .send({
          entityID,
          wallet,
          serverName: ORIGIN_SERVERS[0][0],
          host: ORIGIN_SERVERS[0][1]
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function AddOriginServer2(entityID, wallet) {
    try {
      return (await request(backend)
        .post('/api/AddOriginServer')
        .set(...CONTENT_JSON)
        .send({
          entityID,
          wallet,
          serverName: ORIGIN_SERVERS[1][0],
          host: ORIGIN_SERVERS[1][1]
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function AddEndpoint(entityID, wallet, originServerId, path, verb) {
    try {
      return (await request(backend)
        .post('/api/AddEndpoint')
        .set(...CONTENT_JSON)
        .send({
          entityID,
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

  async function AddEndpointAccessGrant(entityID, wallet, endpointId) {
    try {
      return (await request(backend)
        .post('/api/AddEndpointAccessGrant')
        .set(...CONTENT_JSON)
        .send({
          entityID,
          wallet,
          endpointId
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function GetEndpointAccessGrant(entityID, wallet, endpointAccessGrantId) {
    try {
      return (await request(backend)
        .post('/api/GetEndpointAccessGrant')
        .set(...CONTENT_JSON)
        .send({
          entityID,
          wallet,
          endpointAccessGrantId
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function ShareAccess(entityID, wallet, endpointAccessGrantId, otherClientEntityID) {
    try {
      return (await request(backend)
        .post('/api/ShareAccess')
        .set(...CONTENT_JSON)
        .send({
          entityID,
          wallet,
          endpointAccessGrantId,
          otherClientEntityID
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function ApiProviderHomepageData(entityID, wallet) {
    try {
      return (await request(backend)
        .post('/api/ApiProviderHomepageData')
        .set(...CONTENT_JSON)
        .send({
          entityID,
          wallet
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function ClientHomepageData(entityID, wallet) {
    try {
      return (await request(backend)
        .post('/api/ClientHomepageData')
        .set(...CONTENT_JSON)
        .send({
          entityID,
          wallet
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function Approve(entityID, wallet, endpointAccessGrantId) {
    try {
      return (await request(backend)
        .post('/api/Approve')
        .set(...CONTENT_JSON)
        .send({
          entityID,
          wallet,
          endpointAccessGrantId
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function Revoke(entityID, wallet, endpointAccessGrantId) {
    try {
      return (await request(backend)
        .post('/api/Revoke')
        .set(...CONTENT_JSON)
        .send({
          entityID,
          wallet,
          endpointAccessGrantId
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function Enable(entityID, wallet, endpointAccessGrantId) {
    try {
      return (await request(backend)
        .post('/api/Enable')
        .set(...CONTENT_JSON)
        .send({
          entityID,
          wallet,
          endpointAccessGrantId
        })
        .expect(200)).body;
    } catch (err) {
      throw err;
    }
  }

  async function pingOriginServer(entityID, wallet, endpointAccessGrantId) {
    try {
      await request(backend)
        .get('/api/origin-server-unlimited/math/ping')
        .set({
          auth: JSON.stringify({entityID, wallet, endpointAccessGrantId})
        })
        .expect(200);
    } catch (err) {
      throw err;
    }
  }

  async function callSampleGetOriginServer(entityID, wallet, endpointAccessGrantId) {
    try {
      await request(backend)
        .get('/api/origin-server-unlimited/math/sample-get')
        .set({
          auth: JSON.stringify({entityID, wallet, endpointAccessGrantId})
        })
        .expect(200);
    } catch (err) {
      throw err;
    }
  }

  async function pingOriginServerFail(entityID, wallet, endpointAccessGrantId) {
    try {
      await request(backend)
        .get('/api/origin-server-unlimited/math/ping')
        .set({
          auth: JSON.stringify({entityID, wallet, endpointAccessGrantId})
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
    AddOriginServer2,
    AddEndpoint,
    ClientHomepageData,
    ApiProviderHomepageData,
    AddEndpointAccessGrant,
    GetEndpointAccessGrant,
    ShareAccess,
    Approve,
    Revoke,
    Enable,
    pingOriginServer,
    pingOriginServerFail,
    callSampleGetOriginServer
  };
};

