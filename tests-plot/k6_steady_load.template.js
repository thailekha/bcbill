const http = require('k6/http');
const { check } = require('k6');
const preparedData = <NEED_WALLET> ? JSON.parse(open('/tmp/loadtest-data.json')) : {};

let opts;

// if (<VU_NUM_HERE> <= 10) {
if (true) {

  opts = {
    discardResponseBodies: true,
    scenarios: {
      contacts: {
        executor: 'constant-vus',
        vus: '<VU_NUM_HERE>',
        duration: '<DURATION_HERE>',
        gracefulStop: '120s',
        exec: 'accessEndpoint',
      },
    },
  };

} else {

  opts = {
    discardResponseBodies: true,
    scenarios: {
      contacts: {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: [
          { duration: '2s', target: parseInt(<VU_NUM_HERE> / 10) },
          { duration: '2s', target: parseInt(<VU_NUM_HERE> / 9) },
          { duration: '2s', target: parseInt(<VU_NUM_HERE> / 8) },
          { duration: '2s', target: parseInt(<VU_NUM_HERE> / 7) },
          { duration: '2s', target: parseInt(<VU_NUM_HERE> / 6) },
          { duration: '2s', target: parseInt(<VU_NUM_HERE> / 5) },
          { duration: '2s', target: parseInt(<VU_NUM_HERE> / 4) },
          { duration: '2s', target: parseInt(<VU_NUM_HERE> / 3) },
          { duration: '2s', target: parseInt(<VU_NUM_HERE> / 2) },
          { duration: '60s', target: <VU_NUM_HERE> },
        ],
        gracefulRampDown: "120s",
        exec: 'accessEndpoint',
      },
    },
  };

}

export const options = opts;

export function accessEndpoint(data) {
  try {
    const entityID = preparedData.clientA;
    const wallet = preparedData.clientA_wallet;
    const endpointAccessGrantId = preparedData.grant_get;

    const bc_res = http.get('<URL_HERE>', {
      headers: { 
        auth: <NEED_WALLET> ? JSON.stringify({ entityID, wallet, endpointAccessGrantId }) : {},

        // target is for origin-server-no-fabric
        target: "http://172.29.2.33:9998"
      }
    });
    check(bc_res, {
      'status was 200': (r) => {
        if (r.status === 200) {
          const bc_duration = bc_res.timings.duration;
          console.log(`VU${__VU}_${__ITER}:${bc_duration}`);
          return true;
        }
        return false;
      }
    });
    // const bc_duration = bc_res.timings.duration;
    // console.log(`VU${__VU}_${__ITER}:${bc_duration}`);
  } catch (err) {
    console.error(err);
  }
}
