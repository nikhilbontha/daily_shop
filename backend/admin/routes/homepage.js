const express = require('express');
const router = express.Router();
const Homepage = require('../models/HomepageContent');

router.get('/', async (req, res) => {
  try {
    const doc = await Homepage.findOne().lean();
    res.json(doc || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    let doc = await Homepage.findOne();
    if (!doc) doc = new Homepage(req.body);
    else Object.assign(doc, req.body);
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
