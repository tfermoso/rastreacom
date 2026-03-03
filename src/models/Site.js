// Site model
const mongoose = require("mongoose");

const SiteSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "" },
    emails: { type: [String], default: [] },
    phones: { type: [String], default: [] },
  },
  { timestamps: true } // createdAt / updatedAt
);

module.exports = mongoose.model("Site", SiteSchema);