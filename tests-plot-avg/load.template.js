const http = require('k6/http');
const { check, sleep } = require('k6');
const scene = require('<SCENARIO_FILE>');

// export const options = {
//     discardResponseBodies: true,
//     scenarios: {
//         contacts: {
//             executor: 'constant-vus',
//             vus: 10,
//             duration: '5s',
//             gracefulStop: '20s',
//         },
//     },
// };

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
  try {
    scene.load();
  } catch (err) {
    console.error(err);
  }
}

module.exports.handleSummary = function (data) {
  console.log(`${scene.name()},<CLIENT_NO>,${data.metrics['http_req_duration{scenario:<CLIENT_NO>_client}'].values.avg}`);
}
