// src/lib/discoverUrls.js
const { URL } = require("url");

const DEFAULT_KEYWORDS = [
  // contacto
  "contact", "contacto", "contact-us", "soporte", "support",
  // empresa
  "about", "about-us", "quienes-somos", "quienes", "empresa", "compania", "nosotros", "team",
  // legal
  "legal", "aviso-legal", "privacy", "privacidad", "politica-privacidad",
  "cookies", "terms", "terminos", "condiciones",
];

function normalizeUrl(u) {
  const url = new URL(u);
  url.hash = ""; // quita #fragment
  return url.toString();
}

function isHttpUrl(u) {
  return u.startsWith("http://") || u.startsWith("https://");
}

function scoreUrl(urlStr, keywords = DEFAULT_KEYWORDS) {
  const u = new URL(urlStr);
  const path = (u.pathname || "").toLowerCase();

  let score = 0;

  // Penaliza cosas que suelen ser irrelevantes para contacto/legal
  const bad = ["login", "signin", "signup", "register", "cart", "checkout", "wp-admin"];
  if (bad.some(k => path.includes(k))) score -= 5;

  // Premia keywords
  for (const k of keywords) {
    if (path.includes(k)) score += 10;
  }

  // Premia paths cortos (más típicos: /contacto, /legal)
  const depth = path.split("/").filter(Boolean).length;
  if (depth <= 1) score += 3;
  else if (depth >= 4) score -= 2;

  return score;
}

function discoverUrls(html, baseUrl, {
  maxUrls = 8,
  keywords = DEFAULT_KEYWORDS,
} = {}) {
  const base = new URL(baseUrl);
  const baseDomain = base.hostname.toLowerCase();

  const urls = new Map(); // url -> bestScore

  // Extrae hrefs
  const hrefRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  for (const m of html.matchAll(hrefRe)) {
    const href = (m[1] || "").trim();
    if (!href) continue;

    // filtra esquemas que no nos interesan
    const lower = href.toLowerCase();
    if (lower.startsWith("mailto:") || lower.startsWith("tel:") || lower.startsWith("javascript:")) continue;

    let abs;
    try {
      abs = new URL(href, base).toString();
    } catch {
      continue;
    }

    if (!isHttpUrl(abs)) continue;

    // mismo dominio (o subdominio exacto; si quieres permitir subdominios, ajusta aquí)
    const d = new URL(abs).hostname.toLowerCase();
    if (d !== baseDomain) continue;

    const normalized = normalizeUrl(abs);
    const s = scoreUrl(normalized, keywords);

    // Guarda el mejor score para esa URL
    const prev = urls.get(normalized);
    if (prev === undefined || s > prev) urls.set(normalized, s);
  }

  // Ordena por score desc y devuelve top N
  return [...urls.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxUrls)
    .map(([u]) => u);
}

module.exports = { discoverUrls };