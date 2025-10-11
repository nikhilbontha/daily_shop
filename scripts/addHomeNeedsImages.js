// Script to add default images to home_needs products
const mongoose = require('mongoose');
const Product = require('../models/product');

async function addDefaultImages() {
  const uri = process.env.MONGO_URI;
  if (!uri || uri.trim() === '') {
    console.error('MONGO_URI is not set. Please set MONGO_URI to your MongoDB Atlas connection string in .env');
    process.exit(2);
  }
  await mongoose.connect(uri);
  const defaultImages = [
    '/images/home-needs.jpg',
    '/images/home/home1.jpg',
    '/images/home/home2.jpg',
    '/images/home/home3.jpg',
    '/images/home/home4.jpg',
    '/images/home/home5.jpg',
    '/images/home/home6.jpg',
    '/images/home/home7.jpg',
    '/images/home/home8.jpg',
    '/images/home/home9.jpg',
    '/images/home/home10.jpg'
  ];
  const products = await Product.find({ category: 'home_needs' });
  for (let i = 0; i < products.length; i++) {
    products[i].images = [defaultImages[i % defaultImages.length]];
    await products[i].save();
  }
  console.log('Default images added to home_needs products.');
  mongoose.disconnect();
}

addDefaultImages();
