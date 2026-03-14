const mongoose = require("mongoose");

let isConnected = false;
let connectPromise = null;

async function connectDB() {
  if (isConnected) return true;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("⚠️ MONGODB_URI is not set. Running without database connection.");
    return false;
  }

  if (connectPromise) return connectPromise;

  connectPromise = mongoose
    .connect(uri)
    .then(() => {
      isConnected = true;
      console.log("✅ MongoDB connected");
      return true;
    })
    .catch((err) => {
      console.error("⚠️ MongoDB connection failed:", err.message);
      return false;
    })
    .finally(() => {
      connectPromise = null;
    });

  return connectPromise;
}

module.exports = { connectDB };
