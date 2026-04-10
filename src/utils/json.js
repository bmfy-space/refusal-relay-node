function safeJsonParse(buffer) {
  try {
    return JSON.parse(Buffer.isBuffer(buffer) ? buffer.toString('utf8') : String(buffer));
  } catch {
    return {};
  }
}

module.exports = {
  safeJsonParse
};
