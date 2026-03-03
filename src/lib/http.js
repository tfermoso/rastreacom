// HTTP utilities
const DEFAULT_HEADERS = {
  "User-Agent": "WebStatsBot/1.0 (class project)",
  "Accept": "text/html,application/xhtml+xml",
};

function fetchHtml(url, { timeoutMs = 15000, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { ...DEFAULT_HEADERS, ...headers },
    })
      .then(async (res) => {
        const contentType = res.headers.get("content-type") || "";
        const html = await res.text();
        resolve({
          ok: res.ok,
          status: res.status,
          finalUrl: res.url,
          contentType,
          html,
        });
      })
      .catch(reject)
      .finally(() => clearTimeout(t));
  });
}

module.exports = { fetchHtml };