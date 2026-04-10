const express = require('express');

function createMetaRouter(config) {
  const router = express.Router();

  router.get('/v1/models', (_req, res) => {
    res.json({
      object: 'list',
      data: [
        { id: 'gpt-4o', object: 'model', owned_by: 'openai' },
        { id: 'gpt-4o-mini', object: 'model', owned_by: 'openai' },
        { id: 'claude-sonnet-4-20250514', object: 'model', owned_by: 'anthropic' }
      ]
    });
  });

  router.get('/', (_req, res) => {
    res.json({
      name: 'Refusal Relay',
      version: '1.0.0',
      description: '拒绝消息中继器 - 自动检测并重试拒绝响应',
      endpoints: {
        chat_completions: 'POST /v1/chat/completions',
        responses: 'POST /v1/responses',
        messages: 'POST /v1/messages',
        models: 'GET /v1/models',
        health: 'GET /health'
      },
      config: {
        refusal_relay_enabled: config.enableRefusalRelay,
        max_retries: config.maxRetries
      }
    });
  });

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return router;
}

module.exports = {
  createMetaRouter
};
