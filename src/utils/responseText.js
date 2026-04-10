function extractTextFromContentValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    let text = '';
    for (const item of value) {
      if (typeof item === 'string') {
        text += item;
      } else if (item && typeof item === 'object') {
        if (['text', 'output_text', 'input_text'].includes(item.type)) {
          text += item.text || '';
        } else if (typeof item.content === 'string') {
          text += item.content;
        }
      }
    }
    return text;
  }
  if (value && typeof value === 'object') {
    if (typeof value.text === 'string') {
      return value.text;
    }
    if (typeof value.content === 'string') {
      return value.content;
    }
  }
  return '';
}

function extractTextFromResponse(data) {
  const eventType = data.type;
  if (eventType === 'response.output_text.delta' || eventType === 'response.refusal.delta') {
    return data.delta || '';
  }
  if (eventType === 'response.output_text.done' || eventType === 'response.refusal.done') {
    return data.text || '';
  }

  if (Array.isArray(data.choices)) {
    let text = '';
    for (const choice of data.choices) {
      if (choice.message) {
        text += extractTextFromContentValue(choice.message.content || '');
      } else if (choice.text) {
        text += choice.text;
      } else if (choice.delta) {
        text += extractTextFromContentValue(choice.delta.content || '');
      }
    }
    return text;
  }

  if (typeof data.output === 'string') {
    return data.output;
  }

  if (Array.isArray(data.output)) {
    let text = '';
    for (const item of data.output) {
      if (item && item.type === 'message' && Array.isArray(item.content)) {
        for (const content of item.content) {
          if (content.type === 'output_text') {
            text += content.text || '';
          }
        }
      }
    }
    return text;
  }

  return '';
}

module.exports = {
  extractTextFromContentValue,
  extractTextFromResponse
};
