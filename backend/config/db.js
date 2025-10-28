
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

let lastDbError = null;
let isConnected = false;

const connectDB = async () => {
  // Atlas-only: require MONGO_URI
  const mongoUri = process.env.MONGO_URI && process.env.MONGO_URI.trim() !== '' ? process.env.MONGO_URI : null;
  if (!mongoUri) {
    console.error('❌ MONGO_URI is not set. This application requires a MongoDB Atlas connection string in MONGO_URI.');
    return null;
  }

  try {
    // Use a small connection timeout and keep other defaults from mongoose 6+/8+
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    lastDbError = null;
    isConnected = true;
    // Try to show the host/cluster used for easier debugging
    let hostDisplay = mongoUri;
    try {
      const url = new URL(mongoUri.replace('mongodb+srv://', 'http://'));
      hostDisplay = url.host;
    } catch (e) {
      // ignore parsing errors
    }
          console.log(`✅ Connected to MongoDB Atlas (${hostDisplay})`);
    // Return the underlying MongoClient for session stores or other uses
    try {
      return mongoose.connection.getClient();
    } catch (e) {
      // If for some reason getClient isn't available, return null
      return null;
    }
  } catch (err) {
    lastDbError = err && err.message ? err.message : err;
    isConnected = false;
    console.error('❌ MongoDB Connection Error:', lastDbError);
    // Do not attempt any fallback here; this module only respects the provided MONGO_URI.
    // Return null so the caller can decide whether to abort startup or run without DB.
    return null;
  }
};

module.exports = connectDB;
module.exports._dbStatus = () => ({ connected: isConnected, lastError: lastDbError });
