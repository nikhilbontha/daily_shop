
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/user');
const Product = require('../models/product');

// Middleware to protect route
function isLoggedIn(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/auth/login');
}

// List all orders for the logged-in user
router.get('/orders', isLoggedIn, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const orders = await Order.find({ userId })
      .populate('userId')
      .populate('items.productId')
      .sort({ createdAt: -1 });
    res.render('order', { orders }); // Pass orders array
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching orders');
  }
});

// Get a single order by ID
router.get('/order/:id', isLoggedIn, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.session.user._id;
    const order = await Order.findOne({ _id: orderId, userId })
      .populate('userId')
      .populate('items.productId');
    if (!order) {
      return res.status(404).send('Order not found');
    }
    res.render('order', { order }); // Pass single order object
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching order');
  }
});

// Create a new order
router.post('/order', isLoggedIn, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { items, totalPrice, paymentMethod, paymentStatus } = req.body;
    // items: [{ productId, quantity }]
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).send('No items provided');
    }
    const order = new Order({
      userId,
      items,
      totalPrice,
      paymentMethod,
      paymentStatus
    });
    await order.save();
    res.redirect('/orders');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating order');
  }
});

module.exports = router;
