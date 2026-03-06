const express = require("express");
const router = express.Router();
const { getAiClient } = require("../lib/ai/client");

const { analyzeSite } = require("../lib/analyzeSite");
const Site = require("../models/Site");
const User = require("../models/User"); // ✅ IMPORTANTE: ajusta el path/nombre si es distinto
const { normalizeUrl } = require("../lib/normalizeUrl");
const { normalizeExtractionWithAI } = require("../lib/ai/normalizeExtraction");


const requireAuth = require("../middlewares/requireAuth");

router.use(requireAuth);

router.get("/profile", (req, res) => {
  res.render("user/profile", { user: req.session.user });
});

router.get("/dashboard", async (req, res) => {
  // ✅ stats SIEMPRE definido
  let stats = { usersCount: 0, sitesCount: 0 };

  try {
    const [usersCount, sitesCount] = await Promise.all([
      User.countDocuments({}),
      Site.countDocuments({}),
    ]);
    stats = { usersCount, sitesCount };
  } catch (err) {
    console.error("Error dashboard:", err);
  }

  return res.render("user/dashboard", {
    user: req.session.user,
    stats,
  });
});

router.get("/analyze", async (req, res) => {
  try {
    const recentSites = await Site.find({})
      .sort({ lastAnalyzedAt: -1, updatedAt: -1 })
      .limit(8)
      .select("url name lastAnalyzedAt emails phones error")
      .lean();

    res.render("user/analyze", {
      user: req.session.user,
      recentSites,
      prefillUrl: req.query.url || "",
    });
  } catch (e) {
    console.error("Error cargando recientes:", e);
    res.render("user/analyze", {
      user: req.session.user,
      recentSites: [],
      prefillUrl: req.query.url || "",
    });
  }
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
      includeVisited: true,
      ...(options && typeof options === "object" ? options : {}),
    };

    const forceRefresh = Boolean(analyzeOptions.forceRefresh);
    delete analyzeOptions.forceRefresh;

    const normalized = normalizeUrl(url);
    const now = new Date();

    const ttlDays = Number(process.env.ANALYSIS_CACHE_TTL_DAYS || 7);
    const newExpiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

    // CACHE
    if (!forceRefresh) {
      const cached = await Site.findOne({ url: normalized }).lean();

      if (cached && cached.expiresAt && cached.expiresAt > now) {
        Site.updateOne({ _id: cached._id }, { $inc: { hits: 1 } }).catch(() => { });

        return res.json({
          source: "cache",
          cachedAt: cached.lastAnalyzedAt,
          expiresAt: cached.expiresAt,
          result: {
            name: cached.name || "",
            url: cached.url,
            emails: cached.emails || [],
            phones: cached.phones || [],
            ...(cached.visited && cached.visited.length ? { visited: cached.visited } : {}),
            ...(cached.error ? { error: cached.error } : {}),
          },
        });
      }
    }

    // 1) ANALIZA (RAW)
    const resultRaw = await analyzeSite(normalized, analyzeOptions);

    // 2) NORMALIZA (IA o fallback)
    const result = await normalizeExtractionWithAI(resultRaw);

    // 3) GUARDA ya normalizado
    await Site.updateOne(
      { url: normalized },
      {
        $set: {
          url: result.url || normalized,
          name: result.name || "",
          emails: Array.isArray(result.emails) ? result.emails : [],
          phones: Array.isArray(result.phones) ? result.phones : [],
          visited: Array.isArray(result.visited) ? result.visited : [],
          error: result.error || "",
          lastAnalyzedAt: now,
          expiresAt: newExpiresAt,
          sector: result.sector || "",
          bestEmail: result.bestEmail || "",
          bestPhone: result.bestPhone || "",
        },
        $inc: { hits: 1 },
      },
      { upsert: true }
    );

    // 4) RESPUESTA
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

router.post("/chat", async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Falta 'message'" });
    }

    const client = getAiClient();
    const safeContext = context && typeof context === "object" ? context : {};

    req.session.chatHistory = Array.isArray(req.session.chatHistory) ? req.session.chatHistory : [];
    const history = req.session.chatHistory.slice(-10);
    /*
        const messages = [
          {
            role: "system",
            content:
              "Sabes de todo, habla de lo que quiera el cliente",
          },
          { role: "user", content: "CONTEXTO:\n" + JSON.stringify(safeContext) },
          ...history,
          { role: "user", content: message },
        ];
        */
    const messages = [
      {
        role: "system",
        content: `
Eres el asistente oficial de RastreaCom.

RastreaCom analiza páginas web de empresas para encontrar información de contacto.

El usuario puede analizar una URL y el sistema extrae:
- nombre de empresa
- emails
- teléfonos
- páginas visitadas

Después la IA normaliza los datos y selecciona:
- bestEmail (email principal)
- bestPhone (teléfono principal)

Responde siempre en español.
Sé breve y claro.
Usa el contexto proporcionado si existe.
Si falta información, dilo.
`
      },
      {
        role: "user",
        content: "CONTEXTO:\n" + JSON.stringify(safeContext)
      },
      ...history,
      {
        role: "user",
        content: message
      }
    ];

    const resp = await client.chat.completions.create({
      model: process.env.AI_MODEL_CHAT || "openai/gpt-4o-mini",
      temperature: 0.4,
      messages,
    });

    const answer = resp.choices?.[0]?.message?.content || "";

    req.session.chatHistory.push({ role: "user", content: message });
    req.session.chatHistory.push({ role: "assistant", content: answer });

    return res.json({ answer });
  } catch (e) {
    console.error("Error en /user/chat:", e);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;