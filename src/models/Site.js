// models/Site.js
const mongoose = require("mongoose");

const SiteSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, unique: true, index: true },

    name: { type: String, default: "" },
    emails: { type: [String], default: [] },
    phones: { type: [String], default: [] },

    // NUEVO (cache)
    visited: { type: [String], default: [] },
    error: { type: String, default: "" },
    lastAnalyzedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null, index: true },
    hits: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Si quieres que Mongo borre docs caducados (opcional)
// SiteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Site", SiteSchema);