const express = require('express');
const router = express.Router();


const Order = require('../models/Order');
const Product = require('../models/product');
const ReturnRequest = require('../models/ReturnRequest');


// Returns & Cancel page
router.get('/', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  // Find user's orders
  const orders = await Order.find({ userId: req.session.user._id }).populate('items.productId');
  // Flatten all items from all orders, guard against deleted products
  const items = orders.flatMap(order => order.items.map(item => {
    if (!item.productId) {
      return { id: null, name: 'Product removed' };
    }
    return { id: item.productId._id, name: item.productId.name };
  }));
  res.render('returns', { items });
});

// Handle return or cancel POST
router.post('/', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  const { itemId, reason, actionType, additional } = req.body;
  if (!itemId) return res.status(400).send('No item selected');

  try {
    // Basic validation: ensure the item belongs to user's orders
    const orders = await Order.find({ userId: req.session.user._id }).populate('items.productId');
    const found = orders.some(order => order.items.some(it => String(it.productId && it.productId._id) === String(itemId)));
    if (!found) return res.status(400).send('Item not found in your orders');

    if (actionType === 'return' || actionType === 'cancel') {
      // Persist the request
      const rr = new ReturnRequest({
        userId: req.session.user._id,
        productId: itemId,
        action: actionType,
        reason,
        additional,
        status: 'pending'
      });
      await rr.save();
      if (actionType === 'return') return res.render('return-result', { itemId, reason, additional, id: rr._id });
      return res.render('cancel-result', { itemId, reason, additional, id: rr._id });
    }

    return res.status(400).send('Invalid action');
  } catch (err) {
    console.error('Error processing return/cancel:', err);
    return res.status(500).send('Server error');
  }
});

module.exports = router;
