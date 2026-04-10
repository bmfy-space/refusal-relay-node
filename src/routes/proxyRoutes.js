const express = require('express');
const { requireClientAuth } = require('../middleware/auth');
const { runChatLikeWithRetry, runResponsesWithRetry } = require('../services/retryService');
const { copyResponseHeaders } = require('../utils/headers');

function sendResult(res, result) {
  copyResponseHeaders(result.headers, res);
  if (result.isStream) {
    res.setHeader('content-type', 'text/event-stream');
  }
  res.status(result.status).send(result.buffer);
}

function createProxyRouter(config) {
  const router = express.Router();
  const auth = requireClientAuth(config);
  const rawJson = express.raw({ type: '*/*', limit: '10mb' });

  router.post(['/v1/chat/completions', '/chat/completions', '/v1/messages', '/messages'], auth, rawJson, async (req, res, next) => {
    try {
      const result = await runChatLikeWithRetry({
        req,
        upstreamPath: req.path.includes('messages') ? '/v1/messages' : '/v1/chat/completions',
        config
      });
      sendResult(res, result);
    } catch (error) {
      next(error);
    }
  });

  router.post(['/v1/responses', '/responses'], auth, rawJson, async (req, res, next) => {
    try {
      const result = await runResponsesWithRetry({
        req,
        upstreamPath: '/v1/responses',
        config
      });
      sendResult(res, result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = {
  createProxyRouter
};
