const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.get('/ping', async (req, res) => {
  try {
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/ping', async (req, res) => {
  try {
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = app;
