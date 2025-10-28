// Mongoose Transaction model for UPI checkout prototype
// Fields:
// - txnId: unique transaction identifier (string)
// - orderId: the application order id
// - amount: amount in INR (number)
// - upiLink: generated UPI deep-link URI
// - status: PENDING/PAID/FAILED/CANCELLED/EXPIRED
// - createdAt: Date
// - expiresAt: Date (indexed with TTL to auto-expire documents)
// - metadata: arbitrary object for customer/items
// - pspResponse: optional PSP webhook / response payload

const path = require('path');
// Resolve mongoose from the repository root so we don't accidentally load a second copy
// (if `upi/node_modules` exists this module would otherwise load that copy and create
// a separate connection pool that isn't connected). This ensures models share the
// same mongoose instance as the main app.
const mongoose = require(require.resolve('mongoose', { paths: [path.resolve(__dirname, '..', '..')] }));

const TransactionSchema = new mongoose.Schema({
  txnId: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  upiLink: { type: String },
  status: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED'], default: 'PENDING' },
  metadata: { type: mongoose.Schema.Types.Mixed },
  pspResponse: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, index: true },
});

// TTL index: documents will be removed by MongoDB once `expiresAt` < now()
// Set the TTL to 0 seconds from the `expiresAt` field (MongoDB will remove when expired)
TransactionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Transaction', TransactionSchema);
