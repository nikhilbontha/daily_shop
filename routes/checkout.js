const express = require('express');
const router = express.Router();

const Product = require('../models/product');

router.get('/checkout', async (req, res) => {
  if (!req.session || !req.session.cart || req.session.cart.length === 0) {
    return res.redirect('/cart');
  }

  // Normalize session cart entries to an array of product ids
  const ids = req.session.cart.map(c => {
    if (!c) return null;
    if (typeof c === 'string') return c;
    if (c.productId) return c.productId;
    if (c._id) return c._id;
    return null;
  }).filter(Boolean);

  // Fetch products in cart and calculate total price
  const products = await Product.find({ _id: { $in: ids } }).lean();

  // Map products and compute subtotal considering quantities stored in session
  const productsWithQty = products.map(p => {
    const entry = req.session.cart.find(c => String(c.productId || c) === String(p._id));
    const qty = entry ? (entry.qty || 1) : 1;
    return { ...p, qty, subtotal: (p.price || 0) * qty };
  });

  const totalPrice = productsWithQty.reduce((sum, p) => sum + (p.subtotal || 0), 0);
  res.render('checkout', { totalPrice, cart: productsWithQty, user: req.session.user });
});

module.exports = router;