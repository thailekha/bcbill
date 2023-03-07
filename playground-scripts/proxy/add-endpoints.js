const axios = require('axios');

const addServer = async (serverName, serverUrl, endpoints) => {
  try {
    const response = await axios.post('http://localhost:3000/servers', { name: serverName, url: serverUrl, endpoints });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};

const callEndpoint = async (serverName, endpoint) => {
  try {
    const response = await axios.get(`http://localhost:3000/${serverName}/${endpoint}`);
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};

async function main() {
  // Add a new origin server
  await addServer('awesome-rest-server', 'localhost:9998', ['/hello', '/ping']);

  // Call an endpoint on the origin server
  // await callEndpoint('awesome-rest-server', 'ping');
}

main();
