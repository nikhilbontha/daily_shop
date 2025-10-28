const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const status = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ message: 'Backend working fine!', dbStatus: status });
  } catch (err) {
    res.status(500).json({ message: 'Error checking DB', error: err.message });
  }
});

module.exports = router;
