function buildChatFallbackResponse(model, content) {
  return {
    id: 'chatcmpl-relay',
    object: 'chat.completion',
    created: 0,
    model,
    choices: [{
      index: 0,
      message: { role: 'assistant', content },
      finish_reason: 'stop'
    }]
  };
}

function buildResponsesFallbackResponse(model, content) {
  return {
    id: 'resp-relay',
    object: 'response',
    created: 0,
    model,
    output: [{
      type: 'message',
      role: 'assistant',
      content: [{ type: 'output_text', text: content }]
    }]
  };
}

function buildStreamingResponsePayload(model, content) {
  const payload = buildResponsesFallbackResponse(model, content);
  return Buffer.from(`data: ${JSON.stringify(payload)}\n\ndata: [DONE]\n\n`);
}

module.exports = {
  buildChatFallbackResponse,
  buildResponsesFallbackResponse,
  buildStreamingResponsePayload
};
