// This script will ensure all products have an images array.
// If a product has an `image` field, it will be moved to `images[0]`.
// If no image is present, a default image will be set.

const mongoose = require('mongoose');
const Product = require('../models/product');

const DEFAULT_IMAGE = 'https://i.imgur.com/1O1cR5R.jpg'; // You can change this to any default image

async function fixProductImages() {
  await mongoose.connect('mongodb://localhost:27017/my_proj');
  const products = await Product.find({});
  let fixed = 0;
  for (const p of products) {
    let update = {};
    // If product has 'image' field
    if (p.image) {
      update.images = [p.image];
      update.$unset = { image: "" };
    }
    // If product has no images or images is empty
    if (!p.images || !Array.isArray(p.images) || p.images.length === 0) {
      update.images = [DEFAULT_IMAGE];
    }
    if (Object.keys(update).length > 0) {
      await Product.updateOne({ _id: p._id }, update);
      fixed++;
    }
  }
  console.log(`Fixed images for ${fixed} products.`);
  mongoose.disconnect();
}

fixProductImages();
