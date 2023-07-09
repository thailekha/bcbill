const http = require('k6/http');
const { check } = require('k6');
const preparedData = JSON.parse(open('/tmp/loadtest-data.json'));

export const options = {
    discardResponseBodies: true,
    scenarios: {
        contacts: {
            executor: 'constant-vus',
            vus: '<VU_NUM_HERE>',
            duration: '120s',
            gracefulStop: '20s',
            exec: 'accessEndpoint',
        },
    },
};

export function accessEndpoint(data) {
  try {
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
    console.log(`VU${__VU}_${__ITER}:${bc_duration}`);
  } catch (err) {
    console.error(err);
  }
}
