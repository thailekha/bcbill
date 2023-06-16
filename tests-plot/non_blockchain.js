function noproxy() {
  const noproxy_res = http.get('http://localhost:9998/sample-get');
  check(noproxy_res, {
    'status was 200': (r) => r.status === 200
  });
  const noproxy_duration = noproxy_res.timings.duration;
  console.log(`VU${__VU}_noproxy:${noproxy_duration}`);
}

function dummyProxy() {
  const dummyproxy_res = http.get('http://localhost:9999/api/origin-server-no-fabric/sample-get', {
    headers: { target:  "http://localhost:9998" }
  });
  check(dummyproxy_res, {
    'status was 200': r => r.status == 200
  });
  const dummyproxy_duration = dummyproxy_res.timings.duration;
  console.log(`VU${__VU}_dummyproxy:${dummyproxy_duration}`);
}