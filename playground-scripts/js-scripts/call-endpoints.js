const axios = require('axios');

// const proxyUrl = 'http://localhost:9999';
const targetUrl = 'http://localhost:9998/ping';

axios.get(targetUrl, { proxy: { host: 'localhost', port: 9999 } })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });
