// POST /api/webhook/psp
// Prototype webhook receiver for PSPs; verifies a shared secret header and updates txn status.

const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');

// Simple shared-secret verification for prototype
function verifySecret(req) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return false; // no secret configured -> fail
  const header = req.header('x-webhook-secret') || req.header('x-webhook-signature');
  return header && header === secret;
}

router.post('/psp', async (req, res) => {
  try {
    // prototype: verify shared secret
    if (!verifySecret(req)) return res.status(401).json({ error: 'invalid webhook secret' });

    const { txnId, orderId, status, pspData } = req.body;
    if (!txnId && !orderId) return res.status(400).json({ error: 'txnId or orderId required' });
    if (!status) return res.status(400).json({ error: 'status required' });

    // locate transaction
    const query = txnId ? { txnId } : { orderId };
    const txn = await Transaction.findOne(query);
    if (!txn) return res.status(404).json({ error: 'transaction not found' });

    // Accept only certain statuses from PSP and map to our states
    const allowed = new Set(['PAID', 'FAILED', 'CANCELLED']);
    const newStatus = status.toUpperCase();
    if (!allowed.has(newStatus)) return res.status(400).json({ error: 'invalid status value' });

    txn.status = newStatus;
    txn.pspResponse = pspData || req.body;
    await txn.save();

    // Optionally update order status as well
    if (txn.orderId && newStatus === 'PAID') {
      await Order.updateOne({ orderId: txn.orderId }, { $set: { status: 'PAID' } });
    }

    return res.json({ ok: true, txnId: txn.txnId, status: txn.status });
  } catch (err) {
    console.error('webhook error', err);
    return res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;
