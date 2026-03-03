// src/middlewares/exposeLocals.js
module.exports = function exposeLocals(req, res, next) {
  res.locals.currentUser = req.session?.user || null;
  next();
};