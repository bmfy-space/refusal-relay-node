const { loadConfig } = require('./config');
const { createApp } = require('./app');

const config = loadConfig();
const app = createApp(config);

const server = app.listen(config.port, () => {
  console.log(`Refusal Relay listening on port ${config.port}`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

process.stdin.resume();

module.exports = {
  app,
  config,
  server
};
