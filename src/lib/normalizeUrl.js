// lib/normalizeUrl.js
function normalizeUrl(input) {
  const u = new URL(input);
  u.protocol = u.protocol.toLowerCase();
  u.hostname = u.hostname.toLowerCase();
  u.hash = "";

  // quita trailing slash salvo "/"
  if (u.pathname !== "/" && u.pathname.endsWith("/")) {
    u.pathname = u.pathname.slice(0, -1);
  }

  // ordena query params
  const params = new URLSearchParams(u.searchParams);
  const sorted = new URLSearchParams([...params.entries()].sort(([a], [b]) => a.localeCompare(b)));
  u.search = sorted.toString() ? `?${sorted.toString()}` : "";

  return u.toString();
}

module.exports = { normalizeUrl };