const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// Show all categories
router.get('/', (req, res) => {
  const categories = [
    { name: 'Medicines', slug: 'medicines', image: '/images/medicines.jpg' },
    { name: 'Home Needs', slug: 'home_needs', image: '/images/home-needs.jpg' },
    { name: 'Kitchen Items', slug: 'kitchen', image: '/images/kitchen.jpg' },
    { name: 'Clothes', slug: 'clothes', image: '/images/clothes.jpg' },
    { name: 'Books', slug: 'books', image: '/images/books.jpg' },
    { name: 'Stationery', slug: 'stationery', image: '/images/stationery.jpg' },
    { name: 'Electronics', slug: 'electronics', image: '/images/electronics.jpg' }
  ];
  res.render('categories/all', { categories });
});

// Show products by selected category
router.get('/:category', async (req, res) => {
  // Accept both dashes and underscores in category URL
  let categorySlug = req.params.category.toLowerCase();
  categorySlug = categorySlug.replace(/-/g, '_');
  try {
    const products = await Product.find({ category: categorySlug });
    if (products.length === 0) {
      return res.status(404).send('No products found in this category');
    }
    res.render(`categories/${categorySlug}`, { products, categoryName: categorySlug });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
