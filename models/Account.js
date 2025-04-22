const mongoose = require("mongoose");
const CryptoJS = require("crypto-js"); // Add this line

const AccountSchema = new mongoose.Schema({
  accountType: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Added userId field
  lastModified: { type: Date, default: Date.now },
});

// Middleware to encrypt the password before saving
AccountSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();

  this.password = CryptoJS.AES.encrypt(
    this.password,
    process.env.JWT_SECRET
  ).toString();
  next();
});

// Method to decrypt the password
AccountSchema.methods.decryptPassword = function () {
  return CryptoJS.AES.decrypt(this.password, process.env.JWT_SECRET).toString(
    CryptoJS.enc.Utf8
  );
};

module.exports = mongoose.model("Account", AccountSchema);
