const mongoose = require("mongoose");

const ActiveDeviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  deviceName: { type: String, required: true },
  ipAddress: { type: String, required: true },
  loginTimestamp: { type: Date, default: Date.now },
  token: { type: String, required: true },
  isValid: { type: Boolean, default: true }, // Add this line
});

module.exports = mongoose.model("ActiveDevice", ActiveDeviceSchema);
