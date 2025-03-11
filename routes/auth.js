const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const requestIp = require("request-ip"); // Add this line
const useragent = require("useragent"); // Add this line
const User = require("../models/User");
const ActiveDevice = require("../models/ActiveDevice"); // Add this line
require("dotenv").config();

const router = express.Router();

// Register Route
router.post("/register", async (req, res) => {
  const {
    name,
    email,
    password,
    fullName,
    confirmPassword,
    dateOfBirth,
    address,
  } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({
      name,
      email,
      password: hashedPassword,
      fullName,
      confirmPassword,
      dateOfBirth,
      address,
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body; // Remove deviceName and ipAddress from here

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Get IP address and device information
    const ipAddress = requestIp.getClientIp(req);
    const agent = useragent.parse(req.headers["user-agent"]);
    const deviceName = `${agent.os} - ${agent.device.family}`;

    // Create ActiveDevice entry
    const activeDevice = new ActiveDevice({
      userId: user._id,
      deviceName,
      ipAddress,
      token,
    });
    await activeDevice.save();

    res
      .status(200)
      .json({ message: "Login successful", userId: user._id, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get User Data Route
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).select(
      "email fullName dateOfBirth address password"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const formattedUser = {
      ...user._doc,
      dateOfBirth: user.dateOfBirth.toISOString().split("T")[0],
    };

    res.status(200).json({ userId: user._id, ...formattedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update User Data Route
router.put("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  const { email, fullName, dateOfBirth, address } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        email,
        fullName,
        dateOfBirth,
        address,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Active Devices Route
router.get("/user/:userId/active-devices", async (req, res) => {
  const { userId } = req.params;

  try {
    const activeDevices = await ActiveDevice.find({ userId });
    if (!activeDevices) {
      return res.status(404).json({ message: "No active devices found" });
    }

    res.status(200).json({ activeDevices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Active Token by _id Route
router.delete("/user/:userId/active-devices/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const activeDevice = await ActiveDevice.findByIdAndDelete(id);

    if (!activeDevice) {
      return res.status(404).json({ message: "Active token not found" });
    }

    res.status(200).json({ message: "Active token deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
