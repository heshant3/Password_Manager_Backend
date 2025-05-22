const express = require("express");
const Account = require("../models/Account");
const CryptoJS = require("crypto-js"); // Add this line AES

const router = express.Router();

// Create Account Route
router.post("/create", async (req, res) => {
  const { accountType, email, password, userId } = req.body; // Added userId

  try {
    const account = new Account({ accountType, email, password, userId }); // Added userId
    await account.save();
    res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Account Data by UserId Route
router.get("/data/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const accounts = await Account.find({ userId });
    if (accounts.length === 0) {
      return res
        .status(404)
        .json({ message: "No accounts found for this user" });
    }

    const formattedAccounts = accounts.map((account) => {
      const formattedDate = new Date(account.lastModified)
        .toLocaleString("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
        .replace(",", " |");
      return { ...account._doc, lastModified: formattedDate };
    });

    res.status(200).json(formattedAccounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Account Data for a Specific User
router.get("/data/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const accounts = await Account.find({ userId });
    if (!accounts || accounts.length === 0) {
      return res
        .status(404)
        .json({ message: "No accounts found for this user" });
    }

    res.status(200).json({ accounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Account Data by UserId Route
router.put("/update/:userId", async (req, res) => {
  const { userId } = req.params;
  const { accountType, email, password } = req.body;

  try {
    const account = await Account.findOneAndUpdate(
      { userId },
      { accountType, email, password, lastModified: Date.now() },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const formattedDate = new Date(account.lastModified)
      .toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(",", " |");

    res.status(200).json({
      message: "Account updated successfully",
      account,
      lastModified: formattedDate,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Account Data by AccountId Route
router.put("/updateById/:accountId", async (req, res) => {
  const { accountId } = req.params;
  const { accountType, email, password } = req.body;

  try {
    const account = await Account.findByIdAndUpdate(
      accountId,
      { accountType, email, password, lastModified: Date.now() },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const formattedDate = new Date(account.lastModified)
      .toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(",", " |");

    res.status(200).json({
      message: "Account updated successfully",
      account,
      lastModified: formattedDate,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Account by AccountId Route
router.delete("/delete/:accountId", async (req, res) => {
  const { accountId } = req.params;

  try {
    const account = await Account.findByIdAndDelete(accountId);

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Decrypt Password Route
router.post("/decrypt-password", async (req, res) => {
  const { encryptedPassword } = req.body;

  try {
    const decryptedPassword = CryptoJS.AES.decrypt(
      encryptedPassword,
      process.env.JWT_SECRET
    ).toString(CryptoJS.enc.Utf8);

    res.status(200).json({ password: decryptedPassword });
  } catch (err) {
    res.status(500).json({ error: "Failed to decrypt password" });
  }
});

module.exports = router;
