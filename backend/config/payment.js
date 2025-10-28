const Razorpay = require('razorpay');

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (keyId && keySecret) {
  module.exports = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
} else {
  // Export a stub object so requiring this module doesn't throw during development
  module.exports = {
    orders: {
      create: async () => {
        throw new Error('Razorpay not configured: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
      }
    }
  };
}
