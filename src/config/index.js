const dotenv = require('dotenv');
const {
  DEFAULT_PORT,
  DEFAULT_MAX_RETRIES,
  DEFAULT_ENABLE_REFUSAL_RELAY,
  DEFAULT_CONTINUE_MESSAGE,
  DEFAULT_ACCEPTANCE_RESPONSES,
  DEFAULT_REFUSAL_PATTERNS
} = require('./defaults');

dotenv.config();

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return String(value).toLowerCase() === 'true';
}

function parseCsv(value) {
  if (!value) {
    return [];
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateConfig(config) {
  if (!config.upstreamBaseUrl) {
    throw new Error('UPSTREAM_BASE_URL is required');
  }
  if (!config.upstreamApiKey) {
    throw new Error('UPSTREAM_API_KEY is required');
  }
}

function loadConfig() {
  const config = {
    port: Number(process.env.PORT || DEFAULT_PORT),
    authTokens: parseCsv(process.env.AUTH_TOKENS),
    upstreamBaseUrl: process.env.UPSTREAM_BASE_URL || '',
    upstreamApiKey: process.env.UPSTREAM_API_KEY || '',
    maxRetries: DEFAULT_MAX_RETRIES,
    enableRefusalRelay: parseBoolean(undefined, DEFAULT_ENABLE_REFUSAL_RELAY),
    continueMessage: DEFAULT_CONTINUE_MESSAGE,
    acceptanceResponses: [...DEFAULT_ACCEPTANCE_RESPONSES],
    refusalPatterns: [...DEFAULT_REFUSAL_PATTERNS]
  };

  validateConfig(config);
  config.refusalRegex = new RegExp(config.refusalPatterns.join('|'), 'i');
  return config;
}

module.exports = {
  loadConfig,
  parseBoolean,
  parseCsv,
  validateConfig
};
