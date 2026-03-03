// src/lib/fetchHtmlLimited.js
const { fetchHtml } = require("./http");
const { DomainRateLimiter } = require("./rateLimiter");

const limiter = new DomainRateLimiter({ minIntervalMs: 1000 });

function fetchHtmlLimited(url, opts) {
  return limiter.schedule(url, () => fetchHtml(url, opts));
}

module.exports = { fetchHtmlLimited, limiter };