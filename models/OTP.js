const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // OTP expires in 5 minutes
});

module.exports = mongoose.model("OTP", OTPSchema);
