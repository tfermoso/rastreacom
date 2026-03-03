const mongoose = require("mongoose"); // <-- require correcto

const UserSchema = new mongoose.Schema({   // <-- mongoose.Schema correcto
  email: {
    type: String,
    required: true,
    unique: true
  },
  nombre: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  edad: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", UserSchema);