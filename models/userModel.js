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
    g_accessToken: {
      type: String,
    },
    g_refreshToken: {
      type: String,
    },
    refreshToken: [],
    callSid: String,
  },
  { timestamp: true }
);

module.exports = mongoose.model("customers", userSchema);
