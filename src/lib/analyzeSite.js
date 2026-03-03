// src/lib/analyzeSite.js
const { fetchHtmlLimited } = require("./fetchHtmlLimited");
const { extractSiteInfo } = require("./extract");
const { discoverUrls } = require("./discoverUrls");

async function analyzeSite(startUrl, {
  maxUrls = 8,
  defaultCountryCode = "+34",
  includeVisited = false,
} = {}) {
  const res = await fetchHtmlLimited(startUrl);

  if (!res.ok) {
    return {
      name: "",
      url: res.finalUrl || startUrl,
      emails: [],
      phones: [],
      error: `HTTP ${res.status}`,
    };
  }

  if (!res.contentType.includes("text/html")) {
    return {
      name: "",
      url: res.finalUrl || startUrl,
      emails: [],
      phones: [],
      error: `NOT_HTML ${res.contentType}`,
    };
  }

  const baseUrl = res.finalUrl || startUrl;

  // 1) extrae home
  const mainInfo = extractSiteInfo(
    { url: baseUrl, html: res.html },
    { defaultCountryCode }
  );

  // 2) descubre páginas relevantes
  const candidates = discoverUrls(res.html, baseUrl, { maxUrls });

  // 3) merge
  const emails = new Set(mainInfo.emails);
  const phones = new Set(mainInfo.phones);
  let name = mainInfo.name;
  const visited = [baseUrl];

  for (const u of candidates) {
    const r = await fetchHtmlLimited(u);
    if (!r.ok || !r.contentType.includes("text/html")) continue;

    const final = r.finalUrl || u;
    visited.push(final);

    const info = extractSiteInfo(
      { url: final, html: r.html },
      { defaultCountryCode }
    );

    info.emails.forEach((e) => emails.add(e));
    info.phones.forEach((p) => phones.add(p));
    if (!name && info.name) name = info.name;
  }

  const out = {
    name: name || "",
    url: baseUrl,
    emails: [...emails].sort(),
    phones: [...phones].sort(),
  };

  if (includeVisited) out.visited = [...new Set(visited)];
  return out;
}

module.exports = { analyzeSite };