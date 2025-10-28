// UPI Checkout prototype server
// - Loads environment
// - Connects to MongoDB
// - Exposes /api/checkout and /api/webhook/psp

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const checkoutRoute = require('./routes/checkout');
const webhookRoute = require('./routes/webhook');
const txnRoute = require('./routes/txn');

const app = express();
// Port selection: CLI argument (node server.js 3005) overrides env PORT, otherwise default 2004
const PORT = process.argv[2] || process.env.PORT || 2004;

app.use(bodyParser.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-webhook-secret');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use('/api/checkout', checkoutRoute);
app.use('/api/webhook', webhookRoute);
app.use('/api/txn', txnRoute);

app.get('/', (req, res) => res.send('UPI checkout prototype running'));

async function start() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is not set. This service requires a MongoDB Atlas connection string in MONGO_URI. Please set it in your .env and restart.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB (URI from MONGO_URI)');
  } catch (err) {
    console.error('MongoDB connection error', err);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`UPI prototype server listening on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Choose a different port or stop the process using it.`);
      process.exit(1);
    }
    console.error('Server error', err);
    process.exit(1);
  });
}

// Enable dev routes only when explicitly requested via env var
if (process.env.ENABLE_DEV_ROUTES === 'true') {
  try {
    const devRoute = require('./routes/dev');
    app.use('/api/dev', devRoute);
    console.log('Dev routes enabled at /api/dev');
  } catch (err) {
    console.warn('Dev routes were enabled but failed to load:', err.message);
  }
}

start();

module.exports = app;

// Global error handlers to surface unhandled promise rejections during development
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason && reason.stack ? reason.stack : reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
});
