const http = require('k6/http');
const { check, sleep } = require('k6');
const preparedData = JSON.parse(open('../tests/loadtest-data.json'));

export let options = {
  discardResponseBodies: true,
  scenarios: {
    'stacked_bar': {
      executor: 'per-vu-iterations',
      vus: '50',
      iterations: 1,
      exec: 'accessEndpoint',
    }
  }
};

export function accessEndpoint(data) {
  try {
    const noproxy_res = http.get('http://localhost:9998/sample-get');
    check(noproxy_res, {
      'status was 200': (r) => r.status === 200
    });
    const noproxy_duration = noproxy_res.timings.duration;
    console.log(`VU${__VU}_noproxy:${noproxy_duration}`);
    // ===================================================
    const dummyproxy_res = http.get('http://localhost:9999/api/origin-server-no-fabric/sample-get', {
      headers: { target:  "http://localhost:9998" }
    });
    check(dummyproxy_res, {
      'status was 200': r => r.status == 200
    });
    const dummyproxy_duration = dummyproxy_res.timings.duration;
    console.log(`VU${__VU}_dummyproxy:${dummyproxy_duration}`);
    // ===================================================
    const entityID = preparedData.clientA;
    const wallet = preparedData.clientA_wallet;
    const endpointAccessGrantId = preparedData.grant_get;

    const bc_res = http.get('http://localhost:9999/api/origin-server/math/sample-get', {
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
