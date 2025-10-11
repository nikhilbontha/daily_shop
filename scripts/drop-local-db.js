#!/usr/bin/env node
const { MongoClient } = require('mongodb');
const readline = require('readline');

const argv = process.argv.slice(2);
const autoYes = argv.includes('-y') || argv.includes('--yes');
const mongoUri = process.env.MONGO_URI;
const dbName = process.env.DROP_DB_NAME || 'dailyshop';

if (!mongoUri || mongoUri.trim() === '') {
  console.error('MONGO_URI is not set. This script requires MONGO_URI to point to your Atlas cluster.');
  process.exit(2);
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

(async () => {
  if (!autoYes) {
    console.log(`This will DROP the database "${dbName}" on ${mongoUri}`);
    const ans = (await ask('Are you sure? Type YES to continue: ')).trim();
    if (ans !== 'YES') {
      console.log('Aborted.');
      process.exit(0);
    }
  }

  let client;
  try {
  client = new MongoClient(mongoUri);
    await client.connect();
    const adminDb = client.db(dbName);
    console.log(`Dropping database: ${dbName} ...`);
    await adminDb.dropDatabase();
    console.log('Dropped successfully.');
  } catch (e) {
    console.error('Error while dropping DB:', e && e.message ? e.message : e);
    process.exit(2);
  } finally {
    if (client) await client.close();
  }
})();
