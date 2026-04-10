function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildRetryRequest(originalBody, refusalText, continueMessage) {
  const result = clone(originalBody);
  const messages = Array.isArray(result.messages) ? result.messages : [];

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message && message.role === 'assistant') {
      message.content = refusalText;
      break;
    }
  }

  messages.push({ role: 'user', content: continueMessage });
  result.messages = messages;
  return result;
}

function buildRetryRequestForResponses(originalBody, refusalText, continueMessage) {
  const result = clone(originalBody);

  if (Array.isArray(result.input)) {
    for (let i = result.input.length - 1; i >= 0; i -= 1) {
      const item = result.input[i];
      if (item && item.type === 'message' && item.role === 'assistant') {
        item.content = [{ type: 'output_text', text: refusalText }];
        break;
      }
    }

    result.input.push({
      type: 'message',
      role: 'user',
      content: [{ type: 'input_text', text: continueMessage }]
    });
    return result;
  }

  return buildRetryRequest(result, refusalText, continueMessage);
}

module.exports = {
  buildRetryRequest,
  buildRetryRequestForResponses
};
