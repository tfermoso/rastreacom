// Name extraction utilities
function decodeHtml(s) {
  return (s || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function pickFirstNonEmpty(...values) {
  for (const v of values) {
    const s = (v || "").trim();
    if (s) return s;
  }
  return "";
}

function findMeta(html, attr, value, contentAttr = "content") {
  const re = new RegExp(
    `<meta[^>]*${attr}=["']${value}["'][^>]*${contentAttr}=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const m = html.match(re);
  return m?.[1] ? decodeHtml(m[1]) : "";
}

function findTitle(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m?.[1] ? decodeHtml(m[1]) : "";
}

function findH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m?.[1]) return "";
  const text = m[1].replace(/<[^>]+>/g, " ");
  return decodeHtml(text).replace(/\s+/g, " ").trim();
}

function extractName(html) {
  const ogSiteName = findMeta(html, "property", "og:site_name");
  const ogTitle = findMeta(html, "property", "og:title");
  const twitterTitle = findMeta(html, "name", "twitter:title");
  const title = findTitle(html);
  const h1 = findH1(html);

  return pickFirstNonEmpty(ogSiteName, ogTitle, twitterTitle, title, h1);
}

module.exports = { extractName };