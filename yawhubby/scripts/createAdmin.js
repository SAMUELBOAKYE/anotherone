// scripts/createAdmin.js
// Professional Admin Creation Script for KAAF Noticeboard System
// @version 4.0.0 - PRODUCTION READY

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");
const crypto = require("crypto");
require("dotenv").config();

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  highlight: (msg) => console.log(`${colors.cyan}${msg}${colors.reset}`),
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

const isValidEmail = (email) => /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(email);

const generateSecurePassword = () => {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const special = "!@#$%^&*";
  const allChars = uppercase + lowercase + numbers + special;
  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  for (let i = password.length; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

const connectDB = async () => {
  const uri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/kaaf_noticeboard";
  try {
    await mongoose.connect(uri);
    log.success(`Connected to database: ${mongoose.connection.name}`);
    return true;
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`);
    return false;
  }
};

const createAdmin = async () => {
  console.log("");
  log.highlight("═".repeat(60));
  log.highlight("   KAAF NOTICEBOARD - ADMIN CREATION TOOL");
  log.highlight("═".repeat(60));
  console.log("");

  const connected = await connectDB();
  if (!connected) process.exit(1);

  const User = require("../models/User");

  // Check if admin exists
  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) {
    log.warning(`Admin already exists: ${existingAdmin.email}`);
    const proceed = await question("Create another admin? (y/n): ");
    if (proceed.toLowerCase() !== "y") {
      log.info("Exiting...");
      process.exit(0);
    }
  }

  console.log("");
  log.info("Enter Admin Details:");

  let firstName, lastName, email, username;

  while (true) {
    firstName = await question("First Name: ");
    if (firstName && firstName.trim().length >= 2) break;
    log.error("First name must be at least 2 characters");
  }

  while (true) {
    lastName = await question("Last Name: ");
    if (lastName && lastName.trim().length >= 2) break;
    log.error("Last name must be at least 2 characters");
  }

  while (true) {
    email = await question("Email: ");
    if (isValidEmail(email)) break;
    log.error("Please enter a valid email address");
  }

  username = await question(
    "Username (optional, press Enter to auto-generate): ",
  );
  if (!username) {
    username = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
  }

  console.log("");
  log.info("Password Options:");
  console.log("  1. Generate a secure random password");
  console.log("  2. Enter my own password");
  const passwordChoice = await question("Choose (1 or 2): ");

  let password;
  if (passwordChoice === "1") {
    password = generateSecurePassword();
    log.highlight(`\nGenerated Password: ${password}`);
    log.warning("⚠️  Please save this password securely!");
    await question("\nPress Enter to continue...");
  } else {
    while (true) {
      password = await question("Enter password (min 8 chars): ");
      if (password.length >= 8) break;
      log.error("Password must be at least 8 characters");
    }
    const confirmPassword = await question("Confirm password: ");
    if (password !== confirmPassword) {
      log.error("Passwords do not match");
      process.exit(1);
    }
  }

  console.log("");
  log.info("Review Admin Details:");
  console.log(`   Name: ${firstName} ${lastName}`);
  console.log(`   Email: ${email}`);
  console.log(`   Username: ${username}`);
  console.log(`   Role: Admin`);
  console.log("");

  const confirm = await question("Create this admin? (y/n): ");
  if (confirm.toLowerCase() !== "y") {
    log.warning("Admin creation cancelled");
    process.exit(0);
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  const admin = new User({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role: "admin",
    username: username.toLowerCase(),
    status: "active",
    isActive: true,
    isVerified: true,
    emailVerifiedAt: new Date(),
  });

  await admin.save();

  console.log("");
  log.success("═".repeat(60));
  log.success("ADMIN CREATED SUCCESSFULLY!");
  log.success("═".repeat(60));
  console.log("");
  log.info(`Name: ${firstName} ${lastName}`);
  log.info(`Email: ${email}`);
  log.info(`Username: ${username}`);
  if (passwordChoice === "1") {
    log.highlight(`Password: ${password}`);
    log.warning("⚠️  Please change this password after first login!");
  }
  console.log("");

  await mongoose.disconnect();
  log.success("Database disconnected");
  rl.close();
  process.exit(0);
};

createAdmin().catch((err) => {
  log.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
