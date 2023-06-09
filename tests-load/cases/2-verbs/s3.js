const http = require('k6/http');
const { check } = require('k6');
const preparedData = JSON.parse(open('../../loadtest-data.json'));

export function load() {
  const entityID = preparedData.clientA;
  const wallet = preparedData.clientA_wallet;
  const endpointAccessGrantId = preparedData.grant_put;

  const res = http.put('http://localhost:9999/api/origin-server/math/sample-put', {}, {
    headers: { auth: JSON.stringify({ entityID, wallet, endpointAccessGrantId }) }
  });
  check(res, {
    'status was 200': (r) => r.status === 200
  });
}

export function name() {
  return '/PUT'
}
