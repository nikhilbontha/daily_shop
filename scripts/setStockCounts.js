// Script to set random stockCount values for all products
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function setStockCounts() {
  const uri = process.env.MONGO_URI;
  if (!uri || uri.trim() === '') {
    console.error('MONGO_URI is not set. Please set MONGO_URI to your MongoDB Atlas connection string in .env');
    process.exit(2);
  }
  await mongoose.connect(uri);
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
