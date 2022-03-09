const express = require('express');

const app = express();

app.post('/', function(req, res){
  res.send("Hello world!");
});

app.listen(4000);
