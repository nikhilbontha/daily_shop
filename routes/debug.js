const express = require('express');
const router = express.Router();
const connectDB = require('../config/db');

// Helper to get the db status from config/db.js
router.get('/db-status', (req, res) => {
  try {
    const status = connectDB._dbStatus ? connectDB._dbStatus() : { connected: false, lastError: 'status unavailable' };
    res.json({ ok: true, status });
  } catch (e) {
    res.status(500).json({ ok: false, error: e && e.message ? e.message : e });
  }
});

module.exports = router;
