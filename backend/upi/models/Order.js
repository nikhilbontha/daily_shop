// Simple Order model for prototype validation. In a real app, orders will be more complex.
// Fields:
// - orderId: unique id (string)
// - items: array of objects { productId, qty, price }
// - totalAmount: Number
// - userId: String
// - status: e.g., CREATED, PAID, CANCELLED

const path = require('path');
const mongoose = require(require.resolve('mongoose', { paths: [path.resolve(__dirname, '..', '..')] }));

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  items: [{
    productId: String,
    name: String,
    qty: Number,
    price: Number,
  }],
  totalAmount: { type: Number, required: true },
  userId: { type: String },
  status: { type: String, enum: ['CREATED', 'PAID', 'CANCELLED'], default: 'CREATED' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', OrderSchema);
