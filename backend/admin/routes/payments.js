const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Payments may be stored in a dedicated collection; reuse model if compiled already
const Payment = mongoose.models.Payment || mongoose.model('Payment', new mongoose.Schema({
  paymentId: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  date: { type: Date, default: Date.now },
  status: String,
  meta: Object,
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  refundId: String
}), 'payments');

router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find().populate({ path: 'userId', select: 'email name' }).lean();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const p = await Payment.findById(req.params.id).lean();
    if (!p) return res.status(404).json({ error: 'Payment not found' });
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
