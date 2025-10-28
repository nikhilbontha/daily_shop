const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const path = require('path');
const fs = require('fs');

// GET current settings
router.get('/', async (req, res) => {
  try {
    const doc = await Settings.findOne({ key: 'trash' }).lean();
    res.json(doc && doc.value ? doc.value : { retentionDays: 30 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST update settings
router.post('/', async (req, res) => {
  try {
    const { retentionDays } = req.body;
    const val = { retentionDays: parseInt(retentionDays || 30, 10) };
    await Settings.findOneAndUpdate({ key: 'trash' }, { key: 'trash', value: val }, { upsert: true });
    res.json({ success: true, value: val });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST /purge - trigger purge using retentionDays setting
router.post('/purge', async (req, res) => {
  try {
    const doc = await Settings.findOne({ key: 'trash' }).lean();
    const days = doc && doc.value && doc.value.retentionDays ? doc.value.retentionDays : 30;
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const trashDir = path.join(uploadsDir, 'trash');
    if (!fs.existsSync(trashDir)) return res.json({ success: true, deleted: 0 });
    const now = Date.now();
    let deleted = 0;
    fs.readdirSync(trashDir).forEach(name => {
      const p = path.join(trashDir, name);
      const stat = fs.statSync(p);
      const ageDays = (now - stat.mtimeMs) / (1000 * 60 * 60 * 24);
      if (ageDays >= days) {
        try { fs.unlinkSync(p); deleted++; } catch (e) { }
      }
    });
    res.json({ success: true, deleted });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
