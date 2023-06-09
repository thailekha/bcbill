import http from 'k6/http';
import { check } from 'k6';

export function load(entityID, wallet, endpointAccessGrantId) {
  const res = http.get('http://localhost:9999/api/origin-server-no-fabric/ping', {
    headers: { target:  "http://localhost:9998" }
  });
  check(res, {
    'status was 200': r => r.status == 200
  });
}

export function name() {
  return 'With dummy proxy'
}
