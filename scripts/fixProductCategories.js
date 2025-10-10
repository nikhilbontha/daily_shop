// Script to update all product categories to lowercase slugs
const mongoose = require('mongoose');
const Product = require('../models/product');

const categoryMap = {
  'Medicines': 'medicines',
  'Home Needs': 'home_needs',
  'Kitchen Items': 'kitchen',
  'Clothes': 'clothes',
  'Books': 'books',
  'Stationery': 'stationery',
  'Electronics': 'electronics'
};

async function updateCategories() {
  await mongoose.connect('mongodb://localhost:27017/my_proj');
  // List all products and their categories
  const products = await Product.find();
  console.log('Listing all products and their categories:');
  products.forEach(p => {
    console.log(`Name: ${p.name}, Category: ${p.category}`);
  });

  const updates = [];
  // Update all possible variants to correct slug
  for (const [oldCat, newCat] of Object.entries(categoryMap)) {
    updates.push(Product.updateMany({ category: oldCat }, { $set: { category: newCat } }));
    updates.push(Product.updateMany({ category: oldCat.toLowerCase() }, { $set: { category: newCat } }));
    updates.push(Product.updateMany({ category: oldCat.replace(' ', '_').toLowerCase() }, { $set: { category: newCat } }));
    updates.push(Product.updateMany({ category: oldCat.replace(' ', '') }, { $set: { category: newCat } }));
    updates.push(Product.updateMany({ category: oldCat.replace(' ', '_') }, { $set: { category: newCat } }));
    updates.push(Product.updateMany({ category: oldCat.replace(' Items', '') }, { $set: { category: newCat } }));
    updates.push(Product.updateMany({ category: oldCat.replace(' Needs', '') }, { $set: { category: newCat } }));
    updates.push(Product.updateMany({ category: oldCat.replace('s', '') }, { $set: { category: newCat } }));
  }
  await Promise.all(updates);
  console.log('Product categories updated to lowercase slugs.');
  mongoose.disconnect();
}

updateCategories();
