// This script will fix all products in the database by:
// - Moving the value from `stock` to `stockCount` if present
// - Ensuring `stockCount` is a number
// - Removing the old `stock` field

const mongoose = require('mongoose');
const Product = require('../models/product');

async function fixStockFields() {
  await mongoose.connect('mongodb://localhost:27017/my_proj');
  const products = await Product.find({});
  let fixed = 0;
  for (const p of products) {
    let update = {};
    // If stockCount is missing but stock exists
    if ((p.stockCount === undefined || p.stockCount === null) && p.stock !== undefined) {
      // Convert stock to number if possible
      const num = Number(p.stock);
      if (!isNaN(num)) {
        update.stockCount = num;
      }
      update.$unset = { stock: "" };
    }
    // If stockCount exists but is a string
    if (typeof p.stockCount === 'string') {
      const num = Number(p.stockCount);
      if (!isNaN(num)) {
        update.stockCount = num;
      }
    }
    if (Object.keys(update).length > 0) {
      await Product.updateOne({ _id: p._id }, update);
      fixed++;
    }
  }
  console.log(`Fixed stock fields for ${fixed} products.`);
  mongoose.disconnect();
}

fixStockFields();
