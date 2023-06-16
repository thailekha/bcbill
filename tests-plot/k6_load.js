const http = require('k6/http');
const { check, sleep } = require('k6');
const preparedData = JSON.parse(open('/tmp/loadtest-data.json'));

export let options = {
  discardResponseBodies: true,
  scenarios: {
    'benchmark': {
      executor: 'per-vu-iterations',
      vus: '30',
      iterations: 1,
      exec: 'accessEndpoint',
    }
  }
};

export function accessEndpoint(data) {
  try {
    const entityID = preparedData.clientA;
    const wallet = preparedData.clientA_wallet;
    const endpointAccessGrantId = preparedData.grant_get;

    const bc_res = http.get('http://172.29.1.230:9999/api/origin-server/math/sample-get', {
      headers: { auth: JSON.stringify({ entityID, wallet, endpointAccessGrantId }) }
    });
    check(bc_res, {
      'status was 200': (r) => r.status === 200
    });
    const bc_duration = bc_res.timings.duration;
    console.log(`VU${__VU}_blockchain:${bc_duration}`);
  } catch (err) {
    console.error(err);
  }
}
