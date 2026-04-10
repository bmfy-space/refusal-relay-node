const { buildUpstreamHeaders } = require('../utils/headers');

async function forwardRequest({ path, method, headers, bodyBuffer, config }) {
  const url = `${config.upstreamBaseUrl.replace(/\/$/, '')}${path}`;
  const upstreamHeaders = buildUpstreamHeaders(headers, config.upstreamApiKey);

  const response = await fetch(url, {
    method,
    headers: upstreamHeaders,
    body: bodyBuffer,
    duplex: 'half'
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    status: response.status,
    headers: response.headers,
    buffer
  };
}

module.exports = {
  forwardRequest
};
