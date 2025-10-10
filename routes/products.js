const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// List all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({});
    res.render('products', { products });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Product detail page by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send('Product not found');
    // Track recently viewed
    if (!req.session.recentlyViewed) req.session.recentlyViewed = [];
    const prodId = product._id.toString();
    // Remove if already present, then add to front
    req.session.recentlyViewed = req.session.recentlyViewed.filter(id => id !== prodId);
    req.session.recentlyViewed.unshift(prodId);
    // Limit to 5 items
    req.session.recentlyViewed = req.session.recentlyViewed.slice(0, 5);
    res.render('productDetail', { product });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
