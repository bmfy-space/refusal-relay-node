function isRefusal(text, refusalRegex) {
  if (!text) {
    return false;
  }
  return refusalRegex.test(text);
}

module.exports = {
  isRefusal
};
