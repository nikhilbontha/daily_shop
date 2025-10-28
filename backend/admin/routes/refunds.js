const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Razorpay = require('razorpay');

const Payment = mongoose.models.Payment || mongoose.model('Payment', new mongoose.Schema({
  paymentId: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  date: { type: Date, default: Date.now },
  status: String,
  meta: Object,
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  refundId: String // provider refund id when refunded
}), 'payments');

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

let razor = null;
if (keyId && keySecret) razor = new Razorpay({ key_id: keyId, key_secret: keySecret });

// POST /admin/api/payments/refund
// body: { paymentId, amount } (amount optional - full refund if absent)
router.post('/refund', async (req, res) => {
  try {
    const { paymentId, amount } = req.body;
    if (!paymentId) return res.status(400).json({ error: 'paymentId required' });
    if (!razor) return res.status(500).json({ error: 'Razorpay keys not configured' });

    // create refund via Razorpay
    const refund = await razor.payments.refund(paymentId, { amount: amount ? Math.round(amount * 100) : undefined });

    // Record refund in payments collection and link to order if possible
    // Try to find existing payment document
    let existing = await Payment.findOne({ paymentId }).lean();
    let orderId = null;
    if (existing && existing.orderId) orderId = existing.orderId;
    // create a refund record
    const p = new Payment({ paymentId: paymentId + '::refund', amount: amount || 0, status: 'refunded', meta: refund, orderId, refundId: refund && refund.id ? refund.id : (refund && refund.refund_id) });
    await p.save();

    // If we can link to an order, update order paymentStatus
    if (orderId) {
      const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({}, { strict: false }), 'orders');
      try { await Order.findByIdAndUpdate(orderId, { paymentStatus: 'refunded' }); } catch (e) { }
    }

    res.json({ success: true, refund });
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

module.exports = router;
