const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const httpProxy = require('http-proxy');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
const proxy = httpProxy.createProxyServer();

const originServers = {};

// Endpoint to add a new origin server
app.post('/origins', (req, res) => {
  console.log(req.body);
  const { name, url } = req.body;
  originServers[name] = url;
  res.send(`Added origin server ${name} at ${url}`);
});

// Proxy all requests to the appropriate origin server based on the URL
app.get('*', (req, res) => {
  const url = req.url;
  const [serverName, ...path] = url.substring(1).split('/');
  if (originServers[serverName]) {
    const target = originServers[serverName];
    req.url = `/${path.join('/')}`;
    proxy.web(req, res, { target });
  } else {
    res.status(404).send(`Origin server ${serverName} not found`);
  }
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});