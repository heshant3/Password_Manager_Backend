const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  confirmPassword: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  address: { type: String, required: true },
  accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Account" }],
  activeDevices: [
    { type: mongoose.Schema.Types.ObjectId, ref: "ActiveDevice" },
  ],
});

module.exports = mongoose.model("User", UserSchema);
