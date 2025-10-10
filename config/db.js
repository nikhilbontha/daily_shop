
const mongoose = require('mongoose');
require('dotenv').config();

// Helpful defaults
const DEFAULT_LOCAL_URI = 'mongodb://localhost:27017/dailyshop';

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI && process.env.MONGO_URI.trim() !== '' ? process.env.MONGO_URI : DEFAULT_LOCAL_URI;
  try {
    // Use a small connection timeout and keep other defaults from mongoose 6+/8+
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    const which = mongoUri.includes('localhost') ? 'local MongoDB' : 'MongoDB Atlas';
    // Try to show the host/cluster used for easier debugging
    let hostDisplay = mongoUri;
    try {
      const url = new URL(mongoUri.replace('mongodb+srv://', 'http://'));
      hostDisplay = url.host;
    } catch (e) {
      // ignore parsing errors
    }
    console.log(`✅ Connected to ${which} (${hostDisplay})`);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err && err.message ? err.message : err);
    // Do not exit here so the server can boot for diagnostics; operations that need DB will fail until connected.
  }
};

module.exports = connectDB;
