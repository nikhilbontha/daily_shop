#!/usr/bin/env node
require('dotenv').config();
const connectDB = require('../../config/db');
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  if (!email || !password) {
    console.error('Usage: node createAdmin.js <email> <password>');
    process.exit(1);
  }

  console.log('Connecting to DB...');
  await connectDB();

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 10);
  const a = new Admin({ email, passwordHash: hash });
  await a.save();
  console.log('Admin created:', email);
  process.exit(0);
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
