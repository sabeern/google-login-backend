const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile: String,
    token: {
      type: String,
      required: true,
    },
    refreshToken: [],
  },
  { timestamp: true }
);

module.exports = mongoose.model("customers", userSchema);
