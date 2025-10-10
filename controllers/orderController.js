const Order = require('../models/Order');
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.productId');
    if (!order) return res.status(404).send('Order not found');
    res.render('order', { order });
  } catch (err) {
    res.status(500).send('Server error');
  }
};
