// GET /api/txn/:txnId -> get transaction status and details

const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

router.get('/:txnId', async (req, res) => {
  try {
    const { txnId } = req.params;
    const txn = await Transaction.findOne({ txnId });
    if (!txn) return res.status(404).json({ error: 'transaction not found' });
    return res.json({ txnId: txn.txnId, orderId: txn.orderId, amount: txn.amount, status: txn.status, upiLink: txn.upiLink, expiresAt: txn.expiresAt });
  } catch (err) {
    console.error('txn fetch error', err);
    return res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;
