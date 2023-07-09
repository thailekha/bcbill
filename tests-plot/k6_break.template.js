const http = require('k6/http');
const { check, fail } = require('k6');
const preparedData = JSON.parse(open('/tmp/loadtest-data.json'));

export const options = {
    discardResponseBodies: true,
    scenarios: {
        contacts: {
            executor: 'constant-vus',
            // vus: '4000',
            vus: '<VU_NUM_HERE>',
            duration: '60s',
            gracefulStop: '20s',
            exec: 'accessEndpoint',
        },
    },
    thresholds: {
      http_req_failed: [{
        threshold: 'rate<0.10',
        abortOnFail: true
      }],
    },
};

export function accessEndpoint(data) {
  try {
    const entityID = preparedData.clientA;
    const wallet = preparedData.clientA_wallet;
    const endpointAccessGrantId = preparedData.grant_get;

    const bc_res = http.get('http://localhost:9999/api/origin-server-unlimited/math/sample-get', {
      headers: { auth: JSON.stringify({ entityID, wallet, endpointAccessGrantId }) }
    });
    check(bc_res, {
      'status was 200': (r) => r.status === 200
    });
    // if (bc_res.status === 200) {
    //   fail("");
    // }
  } catch (err) {
    console.error(err);
  }
}

/*export function handleSummary(data) {
    // Print summary to the console
    console.log(data);
}

*/