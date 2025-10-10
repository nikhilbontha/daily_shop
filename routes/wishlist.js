const express = require('express');
const router = express.Router();

const User = require('../models/user');
const Product = require('../models/product');

router.get('/', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  // Find user's wishlist product IDs
  const user = await User.findById(req.session.user._id).populate('wishlist');
  const wishlist = user.wishlist || [];
  res.render('wishlist', { wishlist });
});


// Add product to wishlist
router.post('/add', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  const productId = req.body.productId;
  if (!productId) {
    return res.redirect('/wishlist');
  }
  const User = require('../models/user');
  await User.findByIdAndUpdate(
    req.session.user._id,
    { $addToSet: { wishlist: productId } }
  );
  res.redirect('/wishlist');
});

module.exports = router;
