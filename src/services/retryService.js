const { parseSseContent } = require('../utils/sse');
const { extractTextFromResponse } = require('../utils/responseText');
const { safeJsonParse } = require('../utils/json');
const { isRefusal } = require('./refusalDetector');
const { forwardRequest } = require('./upstreamClient');
const { buildRetryRequest, buildRetryRequestForResponses } = require('../builders/retryPayloads');
const {
  buildChatFallbackResponse,
  buildResponsesFallbackResponse,
  buildStreamingResponsePayload
} = require('../builders/fallbackResponses');

function isErrorResponse(status, buffer) {
  if (status >= 400) {
    return true;
  }

  try {
    const data = JSON.parse(buffer.toString('utf8'));
    return Boolean(data.error);
  } catch {
    return false;
  }
}

function chooseAcceptanceResponse(config) {
  const index = Math.floor(Math.random() * config.acceptanceResponses.length);
  return config.acceptanceResponses[index];
}

function collectStreamingText(buffer) {
  const events = parseSseContent(buffer);
  let fullText = '';

  for (const event of events) {
    if (!event.done) {
      fullText += extractTextFromResponse(event);
    }
  }

  return fullText;
}

async function runChatLikeWithRetry({ req, upstreamPath, config }) {
  const originalBody = req.body;
  const originalBodyJson = safeJsonParse(originalBody);
  const isStream = Boolean(originalBodyJson.stream);
  let retryCount = 0;
  let currentBody = originalBody;
  let currentBodyJson = originalBodyJson;
  let firstRetryBody = null;
  let firstRetryBodyJson = null;

  while (retryCount <= config.maxRetries) {
    const upstream = await forwardRequest({
      path: upstreamPath,
      method: 'POST',
      headers: req.headers,
      bodyBuffer: currentBody,
      config
    });

    if (isErrorResponse(upstream.status, upstream.buffer)) {
      return { ...upstream, isStream: false };
    }

    if (isStream) {
      const responseText = collectStreamingText(upstream.buffer);
      if (isRefusal(responseText, config.refusalRegex)) {
        if (retryCount >= config.maxRetries) {
          const acceptance = chooseAcceptanceResponse(config);
          return {
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            buffer: Buffer.from(JSON.stringify(buildChatFallbackResponse(originalBodyJson.model || 'gpt-4', acceptance))),
            isStream: false
          };
        }

        retryCount += 1;
        if (!firstRetryBody) {
          const acceptance = chooseAcceptanceResponse(config);
          firstRetryBodyJson = buildRetryRequest(currentBodyJson, acceptance, config.continueMessage);
          firstRetryBody = Buffer.from(JSON.stringify(firstRetryBodyJson));
        }
        currentBody = firstRetryBody;
        currentBodyJson = firstRetryBodyJson;
        continue;
      }

      return { ...upstream, isStream: true };
    }

    const responseJson = safeJsonParse(upstream.buffer);
    const responseText = extractTextFromResponse(responseJson);

    if (isRefusal(responseText, config.refusalRegex)) {
      if (retryCount >= config.maxRetries) {
        const acceptance = chooseAcceptanceResponse(config);
        return {
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          buffer: Buffer.from(JSON.stringify(buildChatFallbackResponse(originalBodyJson.model || 'gpt-4', acceptance))),
          isStream: false
        };
      }

      retryCount += 1;
      if (!firstRetryBody) {
        const acceptance = chooseAcceptanceResponse(config);
        firstRetryBodyJson = buildRetryRequest(currentBodyJson, acceptance, config.continueMessage);
        firstRetryBody = Buffer.from(JSON.stringify(firstRetryBodyJson));
      }
      currentBody = firstRetryBody;
      currentBodyJson = firstRetryBodyJson;
      continue;
    }

    return { ...upstream, isStream: false };
  }

  const acceptance = chooseAcceptanceResponse(config);
  return {
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    buffer: Buffer.from(JSON.stringify(buildChatFallbackResponse(originalBodyJson.model || 'gpt-4', acceptance))),
    isStream: false
  };
}

async function runResponsesWithRetry({ req, upstreamPath, config }) {
  const originalBody = req.body;
  const originalBodyJson = safeJsonParse(originalBody);
  const isStream = Boolean(originalBodyJson.stream);
  let retryCount = 0;
  let currentBody = originalBody;
  let currentBodyJson = originalBodyJson;
  let firstRetryBody = null;
  let firstRetryBodyJson = null;

  while (retryCount <= config.maxRetries) {
    const upstream = await forwardRequest({
      path: upstreamPath,
      method: 'POST',
      headers: req.headers,
      bodyBuffer: currentBody,
      config
    });

    if (isErrorResponse(upstream.status, upstream.buffer)) {
      return { ...upstream, isStream: false };
    }

    if (isStream) {
      const responseText = collectStreamingText(upstream.buffer);
      if (isRefusal(responseText, config.refusalRegex)) {
        if (retryCount >= config.maxRetries) {
          const acceptance = chooseAcceptanceResponse(config);
          return {
            status: 200,
            headers: new Headers({ 'content-type': 'text/event-stream' }),
            buffer: buildStreamingResponsePayload(originalBodyJson.model || 'gpt-4', acceptance),
            isStream: true
          };
        }

        retryCount += 1;
        if (!firstRetryBody) {
          const acceptance = chooseAcceptanceResponse(config);
          firstRetryBodyJson = buildRetryRequestForResponses(currentBodyJson, acceptance, config.continueMessage);
          firstRetryBody = Buffer.from(JSON.stringify(firstRetryBodyJson));
        }
        currentBody = firstRetryBody;
        currentBodyJson = firstRetryBodyJson;
        continue;
      }

      return { ...upstream, isStream: true };
    }

    const responseJson = safeJsonParse(upstream.buffer);
    const responseText = extractTextFromResponse(responseJson);

    if (isRefusal(responseText, config.refusalRegex)) {
      if (retryCount >= config.maxRetries) {
        const acceptance = chooseAcceptanceResponse(config);
        return {
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          buffer: Buffer.from(JSON.stringify(buildResponsesFallbackResponse(originalBodyJson.model || 'gpt-4', acceptance))),
          isStream: false
        };
      }

      retryCount += 1;
      if (!firstRetryBody) {
        const acceptance = chooseAcceptanceResponse(config);
        firstRetryBodyJson = buildRetryRequestForResponses(currentBodyJson, acceptance, config.continueMessage);
        firstRetryBody = Buffer.from(JSON.stringify(firstRetryBodyJson));
      }
      currentBody = firstRetryBody;
      currentBodyJson = firstRetryBodyJson;
      continue;
    }

    return { ...upstream, isStream: false };
  }

  const acceptance = chooseAcceptanceResponse(config);
  return {
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    buffer: Buffer.from(JSON.stringify(buildResponsesFallbackResponse(originalBodyJson.model || 'gpt-4', acceptance))),
    isStream: false
  };
}

module.exports = {
  runChatLikeWithRetry,
  runResponsesWithRetry,
  isErrorResponse
};
