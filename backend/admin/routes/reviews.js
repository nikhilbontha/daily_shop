const express = require('express');
const router = express.Router();
const Review = require('../../models/Review');

router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find().populate('userId').lean();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
