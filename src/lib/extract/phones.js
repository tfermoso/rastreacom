// src/lib/extract/phones.js
// Requiere: npm i libphonenumber-js
const { parsePhoneNumberFromString } = require("libphonenumber-js");

// Candidatos "humanos" con separadores típicos. Evita capturar números sueltos muy cortos.
const PHONE_CANDIDATE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d(?:[\s.-]?\d){6,14}/g;

function stripNoise(html) {
  // Quitamos scripts/estilos/noscript para no capturar IDs/timestamps/tokens
  return (html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
}

function sanitizeCandidate(raw) {
  let s = (raw || "").trim();

  // tel:+34....?foo=bar
  if (s.toLowerCase().startsWith("tel:")) s = s.slice(4);
  s = s.split("?")[0];

  // deja solo dígitos y +
  s = s.replace(/[^\d+]/g, "");

  // 00 -> +
  if (s.startsWith("00")) s = "+" + s.slice(2);

  // evita "++++"
  s = s.replace(/\+(?=.)/g, (m, offset) => (offset === 0 ? "+" : ""));

  return s;
}

function normalizePhone(raw, { defaultRegion = "ES" } = {}) {
  const s = sanitizeCandidate(raw);
  if (!s) return null;

  const p = parsePhoneNumberFromString(s, defaultRegion);
  if (!p || !p.isValid()) return null;

  // E.164 (+349XXXXXXXX)
  return p.number;
}

function extractPhones(html, opts = {}) {
  const phones = new Set();

  // 1) tel: (muy fiable)
  const telRe = /tel:([^"'\s?#]+)/gi;
  for (const m of (html || "").matchAll(telRe)) {
    const raw = decodeURIComponent(m[1] || "").trim();
    const n = normalizePhone(raw, opts);
    if (n) phones.add(n);
  }

  // 2) texto "limpio" (menos ruido)
  const cleaned = stripNoise(html);

  for (const m of cleaned.matchAll(PHONE_CANDIDATE_RE)) {
    const candidate = m[0];
    const n = normalizePhone(candidate, opts);
    if (n) phones.add(n);
  }

  return [...phones].sort();
}

module.exports = {
  extractPhones,
  normalizePhone,
};