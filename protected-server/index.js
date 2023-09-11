const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));

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

app.get('/sample-get', cors(), (req, res) => {
  res.json({
    answer: 'This is sample GET endpoint'
  });
});

app.post('/sample-post', cors(), (req, res) => {
  res.json({
    answer: 'sample'
  });
});

app.put('/sample-put', cors(), (req, res) => {
  res.json({
    answer: 'sample'
  });
});

app.delete('/sample-delete', cors(), (req, res) => {
  res.json({
    answer: 'sample'
  });
});

module.exports = app;
