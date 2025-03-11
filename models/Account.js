const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema({
  accountType: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Added userId field
  lastModified: { type: Date, default: Date.now },
});

// Remove the password hashing middleware
// AccountSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

module.exports = mongoose.model("Account", AccountSchema);
