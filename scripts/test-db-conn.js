// Simple DB connection tester. Reads MONGO_URI from environment and lists databases.
const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set in environment. Please set it in .env');
    process.exit(2);
  }

  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log('Databases:');
    dbs.databases.forEach(d => console.log('-', d.name));

    // Optionally list collections in the current database if using a non-SRV connection without auth DB mixing
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('\nCollections in current DB:');
      collections.forEach(c => console.log('-', c.name));
    } catch (e) {
      console.warn('Could not list collections:', e.message);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Connection error:', err.message || err);
    process.exit(1);
  }
}

main();
