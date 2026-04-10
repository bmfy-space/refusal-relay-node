const express = require('express');
const { createProxyRouter } = require('./routes/proxyRoutes');
const { createMetaRouter } = require('./routes/metaRoutes');

function createApp(config) {
  const app = express();

  app.use(createMetaRouter(config));
  app.use(createProxyRouter(config));

  app.use((error, _req, res, _next) => {
    res.status(500).json({ detail: error.message || 'Internal server error' });
  });

  return app;
}

module.exports = {
  createApp
};
