// fix-password.js — run with: node fix-password.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

mongoose
  .connect(
    "mongodb+srv://boakyesamuel189_db_user:8vbEkdKyQu0gMy7N@cluster0.dmvfkhm.mongodb.net/kaaf_noticeboard?retryWrites=true&w=majority&appName=Cluster0",
  )
  .then(async () => {
    const hash = await bcrypt.hash("Admin@1234", 12);

    await mongoose.connection.db
      .collection("users")
      .updateOne(
        { email: "boakyesamuel189@gmail.com" },
        { $set: { password: hash } },
      );

    console.log("✅ Password updated with proper hash");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
  });
