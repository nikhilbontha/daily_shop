// Test script to verify Razorpay API credentials and create a small test order.
// Usage:
// 1) Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment or in a local .env file
// 2) From repo root run: node scripts/test-razorpay.js
// This script will attempt to create a tiny order and print the result or error details.

require('dotenv').config();
const Razorpay = require('razorpay');

async function main() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set in env. Please set them and re-run.');
    process.exit(1);
  }

  const client = new Razorpay({ key_id: keyId, key_secret: keySecret });

  const options = {
    amount: 100, // Rs. 1.00 -> minimal amount
    currency: 'INR',
    receipt: `test_rcpt_${Date.now()}`,
    payment_capture: 1
  };

  try {
    console.log('Creating test order with Razorpay...');
    const order = await client.orders.create(options);
    console.log('Order created successfully:', order);
    process.exit(0);
  } catch (err) {
    // Razorpay errors may include response and statusCode
    console.error('Razorpay API error:');
    if (err && err.statusCode) console.error('Status code:', err.statusCode);
    if (err && err.error) console.error('Error body:', JSON.stringify(err.error, null, 2));
    else console.error(err);
    process.exit(1);
  }
}

main();
