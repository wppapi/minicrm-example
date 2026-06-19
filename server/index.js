require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const { registerWebhooks } = require('./webhooks');
const { createProxyRouter } = require('./proxy');
const { createWebhookRouter } = require('./socket');

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Webhook endpoints — WPP API posts events here
app.use('/webhook', createWebhookRouter(io));

// Proxy endpoints — frontend calls these to send messages and fetch data
app.use('/api', createProxyRouter());

server.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
  await registerWebhooks();
});
