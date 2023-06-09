import http from 'k6/http';
import { check } from 'k6';

export function load(entityID, wallet, endpointAccessGrantId) {
  const res = http.get('http://localhost:9998/sample-get');
  check(res, {
    'status was 200': (r) => r.status === 200
  });
}

export function name() {
  return 'No access control'
}
