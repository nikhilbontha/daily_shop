const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

exports.listOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(200).lean();
    // populate simple user name if possible
    const withUser = await Promise.all(orders.map(async (o) => {
      let user = null;
      try { user = await User.findById(o.userId).lean(); } catch (e) {}
      return Object.assign({}, o, { user });
    }));
    res.render('admin/orders', { orders: withUser });
  } catch (e) {
    console.error('listOrders error', e);
    res.render('admin/orders', { orders: [] });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const o = await Order.findById(req.params.id).lean();
    if (!o) return res.status(404).json({ error: 'Not found' });
    // populate user and product details
    const user = await User.findById(o.userId).lean();
    const items = await Promise.all((o.items || []).map(async (it) => {
      const p = await Product.findById(it.productId).lean();
      return { product: p, qty: it.quantity };
    }));
    return res.json({ order: o, user, items });
  } catch (e) {
    console.error('getOrder error', e);
    return res.status(500).json({ error: 'Server error' });
  }
};
