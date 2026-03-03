// Extract module exports
const { extractEmails } = require("./emails");
const { extractPhones } = require("./phones");
const { extractName } = require("./name");

function extractSiteInfo({ url, html }, opts = {}) {
  return {
    name: extractName(html),
    url,
    emails: extractEmails(html),
    phones: extractPhones(html, opts),
  };
}

module.exports = { extractSiteInfo };