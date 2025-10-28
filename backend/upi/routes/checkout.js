// POST /api/checkout
// Body: { orderId: string, amount: number }
// Validates order, amount, creates Transaction, builds UPI link and QR, returns { transactionId, amount, upiLink, qrBase64 }

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const { buildUpiLink, generateQrDataUrl } = require('../utils/upi');

// small helper to parse amount safely
function parseAmount(a) {
  const num = Number(a);
  if (Number.isNaN(num) || num <= 0) return null;
  return Number(num.toFixed(2));
}

router.post('/', async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });
    const parsedAmount = parseAmount(amount);
    if (!parsedAmount) return res.status(400).json({ error: 'valid amount is required' });

    // Validate order exists and amount matches (do not trust client)
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ error: 'order not found' });
    // Order model uses totalAmount field. Support both totalAmount and total to be forgiving.
    const orderTotal = (typeof order.totalAmount === 'number') ? order.totalAmount : order.total;
    if (typeof orderTotal !== 'number') {
      console.warn('order found but total amount missing or invalid on order:', orderId, order);
      return res.status(400).json({ error: 'order total amount missing on server' });
    }
    if (Math.abs(orderTotal - parsedAmount) > 0.001) {
      return res.status(400).json({ error: 'amount does not match order total', expected: orderTotal });
    }

    const txnId = uuidv4();
    const expiryMinutes = Number(process.env.UPI_EXPIRY_MINUTES || 15);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const note = `Order ${orderId}`;
    const upiLink = buildUpiLink({ txnId, orderId, amount: parsedAmount, note });
    const dataUrl = await generateQrDataUrl(upiLink); // data:image/png;base64,...
    // strip prefix to return pure base64 if desired, but we'll return dataUrl so frontend can directly use it

    const txn = new Transaction({
      txnId,
      orderId,
      amount: parsedAmount,
      upiLink,
      status: 'PENDING',
      expiresAt,
      metadata: { orderSnapshot: order },
    });

    await txn.save();

    return res.json({ transactionId: txnId, amount: parsedAmount, upiLink, qrBase64: dataUrl });
  } catch (err) {
    console.error('checkout error', err);
    if (process.env.DEV_SHOW_ERRORS === 'true') {
      return res.status(500).json({ error: 'internal error', detail: err.message });
    }
    return res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;
