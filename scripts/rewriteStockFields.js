// This script will rewrite all product stock fields:
// - If `stock` exists, set `stockCount` to its value (converted to number)
// - If `stockCount` exists, ensure it's a number
// - Remove `stock` field from all products

const mongoose = require('mongoose');
const Product = require('../models/product');

async function rewriteAllStockFields() {
  await mongoose.connect('mongodb://localhost:27017/my_proj');
  const products = await Product.find({});
  let fixed = 0;
  for (const p of products) {
    let update = {};
    // Always set stockCount from stock if stock exists
    if (p.stock !== undefined) {
      const num = Number(p.stock);
      if (!isNaN(num)) {
        update.stockCount = num;
      }
      update.$unset = { stock: "" };
    } else if (p.stockCount !== undefined) {
      // Ensure stockCount is a number
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
  console.log(`Rewrote stock fields for ${fixed} products.`);
  mongoose.disconnect();
}

rewriteAllStockFields();
