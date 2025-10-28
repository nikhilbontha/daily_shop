const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/', async (req, res) => {
  try {
    const products = await Product.find({}).lean();
    // Recently viewed products
    let recentlyViewed = [];
    if (req.session.recentlyViewed && req.session.recentlyViewed.length) {
      recentlyViewed = await Product.find({ _id: { $in: req.session.recentlyViewed } }).lean();
      // Sort to match session order
      recentlyViewed.sort((a, b) => req.session.recentlyViewed.indexOf(a._id.toString()) - req.session.recentlyViewed.indexOf(b._id.toString()));
    }
    // Suggestions: pick 1-2 random products not in recently viewed
    let suggestionPool = products.filter(p => !req.session.recentlyViewed || !req.session.recentlyViewed.includes(p._id.toString()));
    let suggestions = [];
    if (suggestionPool.length > 0) {
      suggestions = [suggestionPool[Math.floor(Math.random() * suggestionPool.length)]];
    }
    res.render('home', {
      products,
      recentlyViewed,
      suggestions
    });
  } catch (err) {
    console.error('Error loading home page:', err);
    res.render('home', { products: [], recentlyViewed: [], suggestions: [] });
  }
});

module.exports = router;
