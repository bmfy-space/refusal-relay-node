function extractAuthToken(req) {
  const authorization = req.headers.authorization || req.headers['x-api-key'] || '';
  return authorization.replace(/^Bearer\s+/i, '').trim();
}

function requireClientAuth(config) {
  return function clientAuthMiddleware(req, res, next) {
    if (!config.authTokens.length) {
      next();
      return;
    }

    const token = extractAuthToken(req);
    if (!config.authTokens.includes(token)) {
      res.status(401).json({ detail: 'Invalid authentication token' });
      return;
    }

    next();
  };
}

module.exports = {
  extractAuthToken,
  requireClientAuth
};
