// src/middlewares/requireAuth.js
module.exports = function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();

  // Guarda a dónde quería ir para volver después del login
  req.session.returnTo = req.originalUrl;

  return res.redirect("/auth/login");
};