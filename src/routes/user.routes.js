const express = require("express");
const router = express.Router();

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



module.exports = router;