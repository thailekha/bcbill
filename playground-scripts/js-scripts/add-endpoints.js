const axios = require('axios');

const newEndpoint1 = {
  name: 'example1',
  url: 'http://localhost:9998'
};

const newEndpoint2 = {
  name: 'example2',
  url: 'http://localhost:9999'
};

async function createEndpoints() {
  try {
    // Make the first request to create the first endpoint
    const response1 = await axios.post('http://localhost:3000/endpoints', newEndpoint1);
    console.log(response1.data);

    // Once the first request completes successfully, make the second request to create the second endpoint
    const response2 = await axios.post('http://localhost:3000/endpoints', newEndpoint2);
    console.log(response2.data);
  } catch (error) {
    console.error(error);
  }
}

createEndpoints();
