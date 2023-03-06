/*

modify this code so that an admin client can add an origin server (e.g. localhost:9998) with a name (e.g. "awesome-rest-server") and a list of endpoints (e.g. /hello, /ping, etc.). Then a customer endpoint can reach the origin server by sending localhost:3000/awesome-rest-server/ping

 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const httpProxy = require('http-proxy');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
const proxy = httpProxy.createProxyServer();

const servers = {};

// Endpoint to add a new origin server with endpoints
app.post('/servers', (req, res) => {
  const { name, url, endpoints } = req.body;
  if (servers[name]) {
    res.status(400).send(`Origin server ${name} already exists`);
    return;
  }
  servers[name] = { url, endpoints };
  endpoints.forEach(endpoint => {
    if (!endpoints[url]) {
      endpoints[url] = [];
    }
    endpoints[url].push(endpoint);
  });
  res.send(`Added origin server ${name} at ${url} with endpoints ${endpoints}`);
});

// Proxy requests to the appropriate endpoint on the appropriate server based on the URL
app.get('*', (req, res) => {
  const url = req.url;
  const [serverName, ...path] = url.substring(1).split('/');
  const server = servers[serverName];
  if (server) {
    const endpoint = server.endpoints.find(ep => `/${path.join('/')}`.startsWith(ep));
    if (endpoint) {
      const target = `${server.url}${endpoint}`;
      req.url = `/${path.slice(endpoint.split('/').length).join('/')}`;
      proxy.web(req, res, { target: `http://${target}` }, (error) => {
        // Handle errors that occur when forwarding the request
        console.error(`Error forwarding request: ${error}`);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`An error occurred: ${error}`);
      });
    } else {
      res.status(404).send(`Endpoint not found on server ${serverName}`);
    }
  } else {
    res.status(404).send(`Server ${serverName} not found`);
  }
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
