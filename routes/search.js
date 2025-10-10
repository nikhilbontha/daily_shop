const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// Search products by name or description
router.get('/', async (req, res) => {
  const query = req.query.q ? req.query.q.trim() : '';
  if (!query) {
    return res.render('search', { products: [], query });
  }
  const products = await Product.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ]
  });
  res.render('search', { products, query });
});

module.exports = router;
