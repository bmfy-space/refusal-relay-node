function parseSseContent(buffer) {
  const lines = buffer.toString('utf8').split('\n');
  const events = [];

  for (const line of lines) {
    if (!line.startsWith('data: ')) {
      continue;
    }

    const data = line.slice(6);
    if (data.trim() === '[DONE]') {
      events.push({ done: true });
      continue;
    }

    try {
      events.push(JSON.parse(data));
    } catch {
      // ignore malformed SSE lines
    }
  }

  return events;
}

module.exports = {
  parseSseContent
};
