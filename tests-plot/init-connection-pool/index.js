const request = require('superagent');
const preparedData = require('/tmp/loadtest-data.json');

async function accessEndpoint() {
  try {
    const entityID = preparedData.clientA;
    const wallet = preparedData.clientA_wallet;
    const endpointAccessGrantId = preparedData.grant_get;

    const response = await request
      .get('http://localhost:9999/api/origin-server-skip-proxy/math/sample-get')
      .set('auth', JSON.stringify({ entityID, wallet, endpointAccessGrantId }));

    if (response.status !== 200) {
      console.error(`Request failed with status ${response.status}`);
      process.exit(1);
    }

    console.log('Connection pool initiated');

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Run the script when invoked as a standalone script
if (require.main === module) {
  accessEndpoint().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
