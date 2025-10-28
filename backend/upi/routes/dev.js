// Dev-only helper routes for creating test data
// Enabled only when ENABLE_DEV_ROUTES=true is set in environment

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// POST /api/dev/order
// Body: { orderId: string, totalAmount: number, items?: [] }
router.post('/order', async (req, res) => {
  try {
    const { orderId, totalAmount, items, userId } = req.body;
    if (!orderId || !totalAmount) return res.status(400).json({ error: 'orderId and totalAmount required' });

    const existing = await Order.findOne({ orderId });
    if (existing) return res.status(400).json({ error: 'order already exists' });

    const order = new Order({ orderId, totalAmount, items: items || [], userId });
    await order.save();
    return res.json({ ok: true, order });
  } catch (err) {
    console.error('dev create order error', err);
    return res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;
