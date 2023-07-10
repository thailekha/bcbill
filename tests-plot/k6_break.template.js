const http = require('k6/http');
const { check } = require('k6');
const preparedData = JSON.parse(open('/tmp/loadtest-data.json'));

export const options = {
  discardResponseBodies: true,
  scenarios: {
    contacts: {
      executor: 'constant-vus',
      vus: '<VU_NUM_HERE>',
      duration: '80s',
      gracefulStop: '20s',
      exec: 'accessEndpoint',
    },
  },
  // thresholds: {
  //   http_req_failed: [{
  //     // threshold: 'rate<0.10',
  //     threshold: 'rate<0.5',
  //     abortOnFail: true
  //   }],
  // },
};

export function accessEndpoint(data) {
  try {
    const entityID = preparedData.clientA;
    const wallet = preparedData.clientA_wallet;
    const endpointAccessGrantId = preparedData.grant_get;

    const bc_res = http.get('http://<ADDRESS_HERE>:9999/api/origin-server-skip-proxy/math/sample-get', {
      headers: { auth: JSON.stringify({ entityID, wallet, endpointAccessGrantId }) }
    });
    check(bc_res, {
      'status was 200': (r) => r.status === 200
    });
  } catch (err) {
    console.error(err);
  }
}

export function handleSummary(data) {
    console.log(`rate:${data.metrics.http_req_failed.values.rate * 100}`);
}
