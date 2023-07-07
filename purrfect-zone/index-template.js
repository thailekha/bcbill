const express = require('express');
const request = require('superagent');
const app = express();
app.set('view engine', 'pug');
app.get('/', async (req, res) => {
  try {
    const catUrls = await fetchCatPictures(2);
    res.render('index', { catUrls });
  } catch (error) {
    console.log('Error fetching cat pictures:', error);
    res.render('error');
  }
});

async function fetchCatPictures(count) {
  const catUrls = [];
  for (let i = 0; i < count; i++) {
    const response = await request
      .get('http://localhost:9999/api/origin-server-unlimited/SERVER_NAME_HERE/ENDPOINT_HERE')
      .set({
        auth: JSON.stringify({


          entityID: "ENTITY_ID_HERE",
          wallet: "WALLET_HERE",
          endpointAccessGrantId: "GRANT_ID_HERE"


        })
      });
    const data = response.body.toString('base64');
    catUrls.push(`data:image/jpeg;base64,${data}`);
  }
  return catUrls;
}

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
