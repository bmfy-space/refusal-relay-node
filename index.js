const { loadConfig } = require('./src/config');
const { createApp } = require('./src/app');

const config = loadConfig();
const app = createApp(config);

module.exports = app;
