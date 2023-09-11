const express = require('express');
const request = require('superagent');
const app = express();

app.get('/', async (req, res) => {
  try {
    const response = await request
      .get('http://localhost:9999/api/origin-server-unlimited/SERVER_NAME_HERE/ENDPOINT_HERE')
      .set({
        auth: JSON.stringify({


          entityID: "ENTITY_ID_HERE",
          wallet: "WALLET_HERE",
          endpointAccessGrantId: "GRANT_ID_HERE"


        })
      });
    res.send(response.body);
  } catch (error) {
    res.render(JSON.stringify(error));
  }
});

app.listen(3000, () => {});
