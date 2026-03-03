// src/lib/extract/emails.js

// Regex para detectar emails dentro de texto
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

// Muy útil para “limpiar” casos donde el match viene con HTML pegado
function extractPureEmail(str) {
  if (!str) return null;
  const m = str.match(EMAIL_RE);
  if (!m || !m[0]) return null;
  return m[0].toLowerCase();
}

function extractEmails(html) {
  const emails = new Set();
  const source = html || "";

  // 1) mailto: (lo más fiable)
  const mailtoRe = /mailto:([^"'\s?#]+)/gi;
  for (const m of source.matchAll(mailtoRe)) {
    const raw = decodeURIComponent(m[1] || "").trim();
    const addr = raw.split("?")[0].trim();
    const pure = extractPureEmail(addr);
    if (pure) emails.add(pure);
  }

  // 2) regex en texto: pero guardando SOLO el email puro
  for (const m of source.matchAll(EMAIL_RE)) {
    const pure = extractPureEmail(m[0]);
    if (pure) emails.add(pure);
  }

  return [...emails].sort();
}

module.exports = { extractEmails };