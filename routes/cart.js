const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Helper to normalize session.cart into [{ productId, qty }]
function normalizeSessionCart(req) {
  if (!req.session) return [];
  const raw = req.session.cart || [];
  const normalized = [];

  for (const item of raw) {
    if (!item) continue;
    // If item is a string id
    if (typeof item === 'string') {
      normalized.push({ productId: item, qty: 1 });
      continue;
    }
    // If item already looks normalized
    if (typeof item === 'object') {
      if (item.productId && (item.qty || item.qty === 0)) {
        normalized.push({ productId: item.productId, qty: parseInt(item.qty, 10) || 1 });
        continue;
      }
      // If item looks like a product object (has _id), convert
      if (item._id) {
        normalized.push({ productId: item._id, qty: 1 });
        continue;
      }
    }
  }

  req.session.cart = normalized;
  return normalized;
}

// Add product to cart
router.post('/add', async (req, res) => {
  const productId = req.body.productId;
  // cart will store objects { productId, qty }
  if (!req.session.cart) req.session.cart = [];
  // ensure normalized
  normalizeSessionCart(req);
  const existing = req.session.cart.find(c => String(c.productId) === String(productId));
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    req.session.cart.push({ productId, qty: 1 });
  }
  res.redirect('/cart');
});

// View cart
router.get('/', async (req, res) => {
  // Normalize session cart and use normalized values
  const normalized = normalizeSessionCart(req);
  if (!normalized || normalized.length === 0) {
    return res.render('cart', { products: [], cartTotal: 0 });
  }

  const ids = normalized.map(c => c.productId).filter(Boolean);
  const products = await Product.find({ _id: { $in: ids } }).lean();

  const productsWithQty = products.map(p => {
    const entry = normalized.find(c => String(c.productId) === String(p._id));
    const qty = entry ? entry.qty : 1;
    return { ...p, qty, subtotal: (p.price || 0) * qty };
  });

  const cartTotal = productsWithQty.reduce((s, p) => s + (p.subtotal || 0), 0);
  res.render('cart', { products: productsWithQty, cartTotal });
});

// Update quantity
router.post('/update', (req, res) => {
  const { productId, qty } = req.body;
  if (!req.session.cart) return res.redirect('/cart');
  const entry = req.session.cart.find(c => String(c.productId) === String(productId));
  if (entry) {
    const q = parseInt(qty, 10) || 1;
    entry.qty = Math.max(1, q);
  }
  res.redirect('/cart');
});

// Remove item
router.post('/remove', (req, res) => {
  const { productId } = req.body;
  if (!req.session.cart) return res.redirect('/cart');
  // normalize then remove
  normalizeSessionCart(req);
  req.session.cart = req.session.cart.filter(c => String(c.productId) !== String(productId));
  res.redirect('/cart');
});

// Clear the entire cart (useful to remove previous/malformed data)
router.post('/clear', (req, res) => {
  req.session.cart = [];
  res.redirect('/cart');
});

router.get('/clear', (req, res) => {
  req.session.cart = [];
  res.redirect('/cart');
});

module.exports = router;
