const http = require('k6/http');
const { check, sleep } = require('k6');
const preparedData = JSON.parse(open('./loadtest-data.json'));

export let options = {
  discardResponseBodies: true,
  scenarios: {
    '<CLIENT_NO>_client': {
      executor: 'per-vu-iterations',
      vus: '<CLIENT_NO>',
      iterations: 1,
      exec: 'accessEndpoint',
    }
  },
  thresholds: {
    'http_req_duration{scenario:<CLIENT_NO>_client}': ['max>=0']
  }
};

export function accessEndpoint(data) {
  const entityID = preparedData.clientA;
  const wallet = preparedData.clientA_wallet;
  const endpointAccessGrantId = preparedData.grantId;

  try {
    const res = http.get('http://localhost:9999/api/origin-server/math/ping', {
      headers: { auth: JSON.stringify({ entityID, wallet, endpointAccessGrantId }) }
    });
    check(res, {
      'status was 200': r => r.status == 200
    });
    // const res2 = http.get('http://localhost:9998/ping');
    // check(res2, {
    //     'status was 200': r => r.status == 200
    // });
    // const res3 = http.get('http://localhost:9999/api/origin-server-no-fabric/ping', {
    //     headers: { target:  "http://localhost:9998" }
    // });
    // check(res3, {
    //     'status was 200': r => r.status == 200
    // });
  } catch (err) {
    console.error(err);
  }
}

module.exports.handleSummary = function (data) {
  console.log(`<CLIENT_NO>,${data.metrics['http_req_duration{scenario:<CLIENT_NO>_client}'].values.avg}`);
}
