const express = require("express");
const router = express.Router();
const { analyzeSite } = require("../lib/analyzeSite"); // ajusta el path si está en otra carpeta
const Site = require("../models/Site");
const { normalizeUrl } = require("../lib/normalizeUrl");

const requireAuth = require("../middlewares/requireAuth");

// Todo lo que cuelgue de este router queda protegido
router.use(requireAuth);

// Ejemplo: perfil
router.get("/profile", (req, res) => {
    // req.session.user lo pusiste en login
    res.render("user/profile", { user: req.session.user });
});

// Ejemplo: dashboard
router.get("/dashboard", (req, res) => {
    res.render("user/dashboard", { user: req.session.user });
});

router.get("/analyze", (req, res) => {
    res.render("user/analyze", { user: req.session.user });
});


router.get("/analyze", (req, res) => {
  res.render("user/analyze", { user: req.session.user });
});

router.post("/analyze", async (req, res) => {
  try {
    const { url, options } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Falta 'url' o no es válida" });
    }

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ error: "URL inválida (formato)" });
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).json({ error: "La URL debe empezar por http o https" });
    }

    const analyzeOptions = {
      maxUrls: 8,
      defaultCountryCode: "+34",
      includeVisited: true, // si quieres guardar visited
      ...(options && typeof options === "object" ? options : {}),
    };

    // permitir refresco manual desde front: options.forceRefresh=true
    const forceRefresh = Boolean(analyzeOptions.forceRefresh);
    delete analyzeOptions.forceRefresh;

    const normalized = normalizeUrl(url);
    const now = new Date();

    // TTL lógico (sin borrar doc): 7 días por defecto
    const ttlDays = Number(process.env.ANALYSIS_CACHE_TTL_DAYS || 7);
    const newExpiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

    // 1) mira cache
    if (!forceRefresh) {
      const cached = await Site.findOne({ url: normalized }).lean();

      if (cached && cached.expiresAt && cached.expiresAt > now) {
        // incrementa hits (sin bloquear)
        Site.updateOne({ _id: cached._id }, { $inc: { hits: 1 } }).catch(() => {});

        return res.json({
          source: "cache",
          cachedAt: cached.lastAnalyzedAt,
          expiresAt: cached.expiresAt,
          result: {
            name: cached.name || "",
            url: cached.url,
            emails: cached.emails || [],
            phones: cached.phones || [],
            ...(cached.visited?.length ? { visited: cached.visited } : {}),
            ...(cached.error ? { error: cached.error } : {}),
          },
        });
      }
    }

    // 2) analiza
    const result = await analyzeSite(normalized, analyzeOptions);

    // 3) guarda (upsert por url)
    await Site.updateOne(
      { url: normalized },
      {
        $set: {
          url: result.url || normalized, // analyzeSite puede devolver finalUrl como baseUrl
          name: result.name || "",
          emails: Array.isArray(result.emails) ? result.emails : [],
          phones: Array.isArray(result.phones) ? result.phones : [],
          visited: Array.isArray(result.visited) ? result.visited : [],
          error: result.error || "",
          lastAnalyzedAt: now,
          expiresAt: newExpiresAt,
        },
        $inc: { hits: 1 },
      },
      { upsert: true }
    );

    return res.json({
      source: "fresh",
      cachedAt: now,
      expiresAt: newExpiresAt,
      result,
    });
  } catch (error) {
    console.error("Error en /user/analyze:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});





module.exports = router;