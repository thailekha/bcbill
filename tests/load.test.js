const http = require("k6/http");
const { check, sleep } = require("k6");
const data = JSON.parse(open("./loadtest-data.json"));

// exports.options = {
//     vus: 100,
//     duration: "5s",
//     gracefulStop: "1s"
// };

export const options = {
    discardResponseBodies: true,
    scenarios: {
        contacts: {
            executor: 'constant-vus',
            vus: 200,
            duration: '100s',
            gracefulStop: '50s',
        },
    },
};

exports.default = function() {
    // anywhere within 10s
    // sleep(Math.random() * 10);

    const entityID = data.clientA;
    const wallet = data.clientA_wallet;
    const endpointAccessGrantId = data.grantId;

    try {
        const res = http.get('http://localhost:9999/api/origin-server/math/ping', {
            headers: { auth: JSON.stringify({ entityID, wallet, endpointAccessGrantId }) }
        });
        check(res, {
            'status was 200': r => r.status == 200
        });
        // const res2 = http.get('http://localhost:9998/ping');
        // check(res2, {
        //     'status was 200': r => r.status == 200
        // });
        // const res3 = http.get('http://localhost:9999/api/origin-server-no-fabric/ping', {
        //     headers: { target:  "http://localhost:9998" }
        // });
        // check(res3, {
        //     'status was 200': r => r.status == 200
        // });
    } catch (err) {
        console.error(err);
    }
}

