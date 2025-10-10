const crypto = require('crypto');
const Order = require('../models/Order');
exports.handleWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);
  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
  if (signature !== expectedSignature) return res.status(400).send('Invalid signature');
  const event = req.body.event;
  if (event === 'payment.captured') {
    const paymentData = req.body.payload.payment.entity;
    const orderId = paymentData.notes.order_id;
    await Order.findOneAndUpdate({ _id: orderId }, { paymentStatus: 'Paid' });
  }
  res.json({ status: 'ok' });
};
