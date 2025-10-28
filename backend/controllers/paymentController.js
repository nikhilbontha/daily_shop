const Razorpay = require('../config/payment');
const Order = require('../models/Order');
const User = require('../models/User');

const Product = require('../models/Product');
// UPI prototype utilities and Transaction model
const { buildUpiLink, generateQrDataUrl } = require('../upi/utils/upi');
const UpTxn = require('../upi/models/Transaction');
const { randomUUID } = require('crypto');

// Helper to normalize session cart into [{ productId, qty }]
function normalizeSessionCart(req) {
  if (!req.session) return [];
  const raw = req.session.cart || [];
  const normalized = [];
  for (const item of raw) {
    if (!item) continue;
    if (typeof item === 'string') {
      normalized.push({ productId: item, qty: 1 });
      continue;
    }
    if (typeof item === 'object') {
      if (item.productId && (item.qty || item.qty === 0)) {
        normalized.push({ productId: item.productId, qty: parseInt(item.qty, 10) || 1 });
        continue;
      }
      if (item._id) {
        normalized.push({ productId: item._id, qty: 1 });
        continue;
      }
    }
  }
  req.session.cart = normalized;
  return normalized;
}

exports.checkoutPage = async (req, res) => {
  if (!req.session || !req.session.cart || req.session.cart.length === 0) {
    return res.redirect('/cart');
  }
  const normalized = normalizeSessionCart(req);
  const ids = normalized.map(c => c.productId).filter(Boolean);
  const products = await Product.find({ _id: { $in: ids } }).lean();
  const productsWithQty = products.map(p => {
    const entry = normalized.find(c => String(c.productId) === String(p._id));
    const qty = entry ? entry.qty : 1;
    return { ...p, qty, subtotal: (p.price || 0) * qty };
  });
  const totalPrice = productsWithQty.reduce((sum, p) => sum + (p.subtotal || 0), 0);
  res.render('checkout', { products: productsWithQty, totalPrice });
};

exports.createOrder = async (req, res) => {
  const { paymentMethod } = req.body;
  if (!req.session || !req.session.cart || req.session.cart.length === 0) {
    return res.status(400).send('Cart not found. Please add items to your cart.');
  }
  const normalized = normalizeSessionCart(req);
  const ids = normalized.map(c => c.productId).filter(Boolean);
  const products = await Product.find({ _id: { $in: ids } }).lean();
  const productsWithQty = products.map(p => {
    const entry = normalized.find(c => String(c.productId) === String(p._id));
    const qty = entry ? entry.qty : 1;
    return { ...p, qty, subtotal: (p.price || 0) * qty };
  });
  const totalPrice = productsWithQty.reduce((sum, p) => sum + (p.subtotal || 0), 0);
  if (paymentMethod === 'cash') {
    try {
      const order = new Order({
        userId: req.session.user ? req.session.user._id : null,
        items: productsWithQty.map(p => ({ productId: p._id, quantity: p.qty || 1 })),
        totalPrice,
        paymentMethod: 'Cash',
        paymentStatus: 'Pending',
        createdAt: new Date()
      });
      await order.save();
      // Debug: print active DB name and collections
      const db = require('mongoose').connection.db;
      db.listCollections().toArray((err, collections) => {
        if (err) {
          console.error('Error listing collections:', err);
        } else {
          console.log('Active DB:', db.databaseName);
          console.log('Collections:', collections.map(c => c.name));
        }
      });
      console.log('Order saved:', order);
      req.session.cart = [];
      return res.redirect(`/order/${order._id}`);
    } catch (err) {
      console.error('Error saving order:', err);
      return res.status(500).send('Error saving order');
    }
  }
  // UPI flow (prototype): create order, create transaction, generate UPI link & QR, render QR page
  if (paymentMethod === 'upi') {
    try {
      const order = new Order({
        userId: req.session.user ? req.session.user._id : null,
        items: productsWithQty.map(p => ({ productId: p._id, quantity: p.qty || 1 })),
        totalPrice,
        paymentMethod: 'UPI',
        paymentStatus: 'PENDING',
        createdAt: new Date()
      });
      await order.save();

      const txnId = (typeof randomUUID === 'function') ? randomUUID() : `${Date.now()}-${Math.floor(Math.random()*10000)}`;
      const expiryMinutes = Number(process.env.UPI_EXPIRY_MINUTES || 15);
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
      const note = `Order ${order._id}`;
      // allow payee details from env or pass them explicitly here if you prefer
      let upiLink;
      try {
        upiLink = buildUpiLink({ txnId, orderId: String(order._id), amount: totalPrice, note });
      } catch (e) {
        console.error('UPI buildUpiLink error:', e.message);
        // Render a helpful page instructing the developer to set env vars
        return res.status(500).render('upiError', { message: 'UPI payee details are not configured on the server. Please set UPI_PAYEE_VPA and UPI_PAYEE_NAME in your server environment.' });
      }
      const qrDataUrl = await generateQrDataUrl(upiLink);

      const txn = new UpTxn({ txnId, orderId: String(order._id), amount: totalPrice, upiLink, status: 'PENDING', expiresAt, metadata: { orderSnapshot: order } });
      await txn.save();

      // Render a simple page showing the QR and txn info
      return res.render('upiPayment', { upiLink, qrDataUrl, txnId, amount: totalPrice, orderId: order._id });
    } catch (err) {
      console.error('UPI payment flow error:', err);
      return res.status(500).send('Error creating UPI payment (see server logs)');
    }
  }
  const options = {
    amount: totalPrice * 100,
    currency: 'INR',
    receipt: `order_rcptid_${Date.now()}`,
  };
  try {
    const razorpayOrder = await Razorpay.orders.create(options);
    return res.render('payment', { razorpayOrder, totalPrice, paymentMethod });
  } catch (err) {
    console.error('Razorpay orders.create error:', err && err.response ? err.response : err);
    // surface a friendly message and log details for debugging
    if (err && err.error && err.error.description) {
      return res.status(500).send(`Payment provider error: ${err.error.description}`);
    }
    return res.status(500).send('Payment provider error (see server logs)');
  }
};

// POST /api/payment/confirm-upi
// Body: { txnId }
exports.confirmUpiPayment = async (req, res) => {
  try {
    const { txnId } = req.body;
    if (!txnId) return res.status(400).send('txnId required');
    const txn = await UpTxn.findOne({ txnId });
    if (!txn) return res.status(404).send('transaction not found');

    txn.status = 'PAID';
    txn.pspResponse = txn.pspResponse || {};
    txn.pspResponse.manualConfirmed = true;
    await txn.save();

    // update order
    const orderId = txn.orderId;
    await Order.updateOne({ _id: orderId }, { $set: { paymentStatus: 'Paid', paymentMethod: 'UPI' } });

    return res.json({ ok: true, txnId: txn.txnId, status: txn.status });
  } catch (err) {
    console.error('confirmUpiPayment error', err);
    return res.status(500).send('internal error');
  }
};
