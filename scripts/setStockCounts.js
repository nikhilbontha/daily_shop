// Script to set random stockCount values for all products
const mongoose = require('mongoose');
const Product = require('../models/product');

async function setStockCounts() {
  await mongoose.connect('mongodb://localhost:27017/my_proj');
  const stockOptions = [10, 20, 23, 67, 36];
  const products = await Product.find({});
  let updated = 0;
  for (const p of products) {
    // Pick a random stock value from the options
    const stockCount = stockOptions[Math.floor(Math.random() * stockOptions.length)];
    await Product.updateOne({ _id: p._id }, { stockCount });
    updated++;
  }
  console.log(`Set stockCount for ${updated} products.`);
  mongoose.disconnect();
}

setStockCounts();
