import bcrypt from "bcrypt";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const ADMIN_USERNAME = "shreyansh0009";
const NEW_PASSWORD = "Admin@1234";

async function resetAdminPassword() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Generate new bcrypt hash (10 rounds, same as the app uses)
    const newHash = await bcrypt.hash(NEW_PASSWORD, 10);

    const result = await mongoose.connection
      .collection("users")
      .updateOne(
        { username: ADMIN_USERNAME.toLowerCase() },
        { $set: { password: newHash } }
      );

    if (result.matchedCount === 0) {
      console.error(`❌ No user found with username: "${ADMIN_USERNAME}"`);
      console.error("   Make sure the username is correct in MongoDB.");
    } else {
      console.log("🎉 Password reset successful!\n");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`  Username : ${ADMIN_USERNAME}`);
      console.log(`  Password : ${NEW_PASSWORD}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      console.log("👉 You can now log in with the above credentials.");
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

resetAdminPassword();
