
const express = require('express');
const router = express.Router();
const Review = require('../models/review');

// Show reviews and review form
router.get('/', async (req, res) => {
  const reviews = await Review.find().sort({ createdAt: -1 });
  res.render('reviews', { reviews });
});

// Handle review submission
router.post('/', async (req, res) => {
  const { name, rating, text } = req.body;
  if (!name || !rating || !text) {
    return res.redirect('/reviews');
  }
  await Review.create({ name, rating, text });
  res.redirect('/reviews');
});

module.exports = router;
