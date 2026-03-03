const express = require("express");
const router = express.Router();
const { analyzeSite } = require("../lib/analyzeSite"); // ajusta el path si está en otra carpeta


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




router.post("/analyze", async (req, res) => {
  try {
    const { url, options } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Falta 'url' o no es válida" });
    }

    // Validación básica de URL
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

    const result = await analyzeSite(url, analyzeOptions);
    return res.json(result);
  } catch (error) {
    console.error("Error en /user/analyze:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});




module.exports = router;