function buildUpstreamHeaders(headers, upstreamApiKey) {
  const nextHeaders = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (['host', 'content-length', 'authorization'].includes(lowerKey)) {
      continue;
    }
    nextHeaders[key] = value;
  }

  if (upstreamApiKey) {
    nextHeaders.Authorization = `Bearer ${upstreamApiKey}`;
  }

  return nextHeaders;
}

function copyResponseHeaders(sourceHeaders, res) {
  for (const [key, value] of sourceHeaders.entries()) {
    if (['content-length', 'transfer-encoding', 'connection', 'keep-alive'].includes(key.toLowerCase())) {
      continue;
    }
    res.setHeader(key, value);
  }
}

module.exports = {
  buildUpstreamHeaders,
  copyResponseHeaders
};
