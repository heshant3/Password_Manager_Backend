const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const requestIp = require("request-ip"); // Add this line
const useragent = require("useragent"); // Add this line
const nodemailer = require("nodemailer"); // Add this line
const User = require("../models/User");
const ActiveDevice = require("../models/ActiveDevice"); // Add this line
require("dotenv").config();

const router = express.Router();

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

    // Send email notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Login Notification",
      text: `You have successfully logged in from IP: ${ipAddress} using device: ${deviceName}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res
      .status(200)
      .json({ message: "Login successful", userId: user._id, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Password Reset Request Route
router.post("/request-password-reset", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "2m", // Set token expiration to 2 minutes
    });

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    // Send email with reset link
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      text: `Click the following link to reset your password: ${resetLink}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Error sending email" });
      } else {
        console.log("Email sent:", info.response);
        return res.status(200).json({ message: "Password reset link sent" });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Password Update Route
router.post("/update-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Link has expired" });
    }
    res.status(500).json({ error: err.message });
  }
});

// Refresh Token Route
router.post("/refresh-token", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const newToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({ token: newToken });
  } catch (err) {
    res.status(401).json({ message: "Token is invalid or expired" });
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

    // Expire the token
    jwt.sign({ userId: activeDevice.userId }, process.env.JWT_SECRET, {
      expiresIn: 0,
    });

    res
      .status(200)
      .json({ message: "Active token deleted and expired successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout All Route
router.post("/logout-all", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Delete all active devices for the user
    await ActiveDevice.deleteMany({ userId });

    res
      .status(200)
      .json({ message: "Logged out from all devices successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check Token Validity Route
router.get("/check-token/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const activeDevice = await ActiveDevice.findOne({ token });
    if (!activeDevice || !activeDevice.isValid) {
      return res.status(401).json({ message: "false" });
    }

    res.status(200).json({ message: "true" });
  } catch (err) {
    res.status(500).json({ error: err.message }); // Fix this line
  }
});

// Change Password Route
router.put("/user/:userId/change-password", async (req, res) => {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
