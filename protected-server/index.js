const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

function parseFloatArray(stringArray) {
  return stringArray.map(s => parseFloat(s));
}

function sum(nums) {
  return nums.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
}

app.get('/ping', (req, res) => {
  res.json({
    answer: 'pong'
  });
});

app.get('/helloworld', (req, res) => {
  res.json({
    answer: 'helloworld'
  });
});

app.post('/echo', cors(), (req, res) => {
  res.json({
    answer: req.body.message
  });
});

app.post('/square-of', cors(), (req, res) => {
  const number = parseFloat(req.body.number);
  res.json({
    answer: number * number
  });
});

app.post('/sum', cors(), (req, res) => {
  res.json({
    answer: sum(parseFloatArray(req.body.numbers))
  });
});

app.post('/average', cors(), (req, res) => {
  const numbers = parseFloatArray(req.body.numbers);
  res.json({
    answer: sum(numbers) / numbers.length
  });
});

module.exports = app;
