const Razorpay = require('../config/payment');
const Order = require('../models/Order');
const User = require('../models/User');

const Product = require('../models/Product');

// Helper to normalize session cart into [{ productId, qty }]
function normalizeSessionCart(req) {
  if (!req.session) return [];
  const raw = req.session.cart || [];
  const normalized = [];
  for (const item of raw) {
    if (!item) continue;
    if (typeof item === 'string') {
      normalized.push({ productId: item, qty: 1 });
      continue;
    }
    if (typeof item === 'object') {
      if (item.productId && (item.qty || item.qty === 0)) {
        normalized.push({ productId: item.productId, qty: parseInt(item.qty, 10) || 1 });
        continue;
      }
      if (item._id) {
        normalized.push({ productId: item._id, qty: 1 });
        continue;
      }
    }
  }
  req.session.cart = normalized;
  return normalized;
}

exports.checkoutPage = async (req, res) => {
  if (!req.session || !req.session.cart || req.session.cart.length === 0) {
    return res.redirect('/cart');
  }
  const normalized = normalizeSessionCart(req);
  const ids = normalized.map(c => c.productId).filter(Boolean);
  const products = await Product.find({ _id: { $in: ids } }).lean();
  const productsWithQty = products.map(p => {
    const entry = normalized.find(c => String(c.productId) === String(p._id));
    const qty = entry ? entry.qty : 1;
    return { ...p, qty, subtotal: (p.price || 0) * qty };
  });
  const totalPrice = productsWithQty.reduce((sum, p) => sum + (p.subtotal || 0), 0);
  res.render('checkout', { products: productsWithQty, totalPrice });
};

exports.createOrder = async (req, res) => {
  const { paymentMethod } = req.body;
  if (!req.session || !req.session.cart || req.session.cart.length === 0) {
    return res.status(400).send('Cart not found. Please add items to your cart.');
  }
  const normalized = normalizeSessionCart(req);
  const ids = normalized.map(c => c.productId).filter(Boolean);
  const products = await Product.find({ _id: { $in: ids } }).lean();
  const productsWithQty = products.map(p => {
    const entry = normalized.find(c => String(c.productId) === String(p._id));
    const qty = entry ? entry.qty : 1;
    return { ...p, qty, subtotal: (p.price || 0) * qty };
  });
  const totalPrice = productsWithQty.reduce((sum, p) => sum + (p.subtotal || 0), 0);
  if (paymentMethod === 'cash') {
    try {
      const order = new Order({
        userId: req.session.user ? req.session.user._id : null,
        items: productsWithQty.map(p => ({ productId: p._id, quantity: p.qty || 1 })),
        totalPrice,
        paymentMethod: 'Cash',
        paymentStatus: 'Pending',
        createdAt: new Date()
      });
      await order.save();
      // Debug: print active DB name and collections
      const db = require('mongoose').connection.db;
      db.listCollections().toArray((err, collections) => {
        if (err) {
          console.error('Error listing collections:', err);
        } else {
          console.log('Active DB:', db.databaseName);
          console.log('Collections:', collections.map(c => c.name));
        }
      });
      console.log('Order saved:', order);
      req.session.cart = [];
      return res.redirect(`/order/${order._id}`);
    } catch (err) {
      console.error('Error saving order:', err);
      return res.status(500).send('Error saving order');
    }
  }
  const options = {
    amount: totalPrice * 100,
    currency: 'INR',
    receipt: `order_rcptid_${Date.now()}`,
  };
  const razorpayOrder = await Razorpay.orders.create(options);
  res.render('payment', { razorpayOrder, totalPrice, paymentMethod });
};
