// src/lib/rateLimiter.js
const { URL } = require("url");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class DomainRateLimiter {
  constructor({ minIntervalMs = 1000 } = {}) {
    this.minIntervalMs = minIntervalMs;
    this.lastAt = new Map();   // domain -> timestamp(ms) del último request
    this.chain = new Map();    // domain -> Promise para encadenar (cola)
  }

  _domainOf(url) {
    return new URL(url).hostname.toLowerCase();
  }

  async schedule(url, fn) {
    const domain = this._domainOf(url);

    // Encadena tareas por dominio para evitar concurrencia
    const prev = this.chain.get(domain) || Promise.resolve();

    const task = prev
      .catch(() => {}) // no rompas la cadena si una tarea falla
      .then(async () => {
        const now = Date.now();
        const last = this.lastAt.get(domain) || 0;
        const wait = this.minIntervalMs - (now - last);

        if (wait > 0) await sleep(wait);

        // Marca el momento justo antes de ejecutar la petición
        this.lastAt.set(domain, Date.now());
        return fn();
      });

    this.chain.set(domain, task);
    return task;
  }
}

module.exports = { DomainRateLimiter };