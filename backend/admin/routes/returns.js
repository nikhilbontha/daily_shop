const express = require('express');
const router = express.Router();
const ReturnRequest = require('../../models/ReturnRequest');

router.get('/', async (req, res) => {
  try {
      // only return requests (exclude cancellations) for this endpoint
      const items = await ReturnRequest.find({ action: 'return' }).populate('userId productId').lean();
    // normalize reason field: some apps might store it under note/description/message
    const normalized = items.map(it => {
      it.reason = it.reason || it.note || it.description || it.message || it.reasonText || '';
      return it;
    });
    res.json(normalized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancellations-only endpoint
router.get('/cancellations', async (req, res) => {
  try {
    const items = await ReturnRequest.find({ action: 'cancel' }).populate('userId productId').lean();
    const normalized = items.map(it => {
      it.reason = it.reason || it.note || it.description || it.message || it.reasonText || '';
      return it;
    });
    res.json(normalized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const rr = await ReturnRequest.findByIdAndUpdate(req.params.id, { status, updatedAt: new Date() }, { new: true }).lean();
    if (!rr) return res.status(404).json({ error: 'Return request not found' });
    // ensure reason is present on response
    rr.reason = rr.reason || rr.note || rr.description || rr.message || rr.reasonText || '';
    res.json(rr);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await ReturnRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
