require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product'); // Adjust path if needed

const products = [
  // Books
  {
    name: "The Great Gatsby",
    description: "Classic novel by F. Scott Fitzgerald.",
    price: 499,
    images: ["/images/books/gatsby.jpg"],
    stockCount: 30,
    category: "books"
  },
  {
    name: "1984",
    description: "Dystopian novel by George Orwell.",
    price: 399,
    images: ["/images/books/1984.jpg"],
    stockCount: 25,
    category: "books"
  },

  // Clothes
  {
    name: "Men's Casual Shirt",
    description: "Comfortable cotton shirt.",
    price: 899,
    images: ["/images/clothes/shirt1.jpg"],
    stockCount: 50,
    category: "clothes"
  },
  {
    name: "Cotton T-Shirt",
    description: "Soft and breathable T-shirt.",
    price: 499,
    images: ["/images/clothes/tshirt.jpg"],
    stockCount: 100,
    category: "clothes"
  },

  // Medicines
  {
    name: "Pain Relief Tablets",
    description: "Effective pain relievers for headaches.",
    price: 199,
    images: ["/images/medicines/pain_relief.jpg"],
    stockCount: 100,
    category: "medicines"
  },
  {
    name: "Cold & Flu Syrup",
    description: "Relief from cold and flu symptoms.",
    price: 299,
    images: ["/images/medicines/cold_flu.jpg"],
    stockCount: 75,
    category: "medicines"
  },

  // Home Needs
  {
    name: "Multi-Purpose Cleaner",
    description: "Cleans and disinfects all surfaces.",
    price: 349,
    images: ["/images/home_needs/cleaner.jpg"],
    stockCount: 80,
    category: "home_needs"
  },
  {
    name: "Laundry Detergent",
    description: "Effective stain removal detergent.",
    price: 499,
    images: ["/images/home_needs/detergent.jpg"],
    stockCount: 60,
    category: "home_needs"
  },

  // Kitchen Items
  {
    name: "Non-Stick Frying Pan",
    description: "Durable and easy to clean.",
    price: 1299,
    images: ["/images/kitchen/frying_pan.jpg"],
    stockCount: 40,
    category: "kitchen"
  },
  {
    name: "Blender",
    description: "High power blender for smoothies.",
    price: 2399,
    images: ["/images/kitchen/blender.jpg"],
    stockCount: 30,
    category: "kitchen"
  },

  // Stationery
  {
    name: "Ballpoint Pens (Pack of 10)",
    description: "Smooth writing pens.",
    price: 199,
    images: ["/images/stationery/pens.jpg"],
    stockCount: 200,
    category: "stationery"
  },
  {
    name: "A4 Notebooks",
    description: "High-quality ruled notebooks.",
    price: 149,
    images: ["/images/stationery/notebooks.jpg"],
    stockCount: 190,
    category: "stationery"
  },

  // Electronics
  {
    name: "Bluetooth Speaker",
    description: "Portable speaker with deep bass.",
    price: 2999,
    images: ["/images/electronics/speaker.jpg"],
    stockCount: 35,
    category: "electronics"
  },
  {
    name: "Wireless Headphones",
    description: "Noise-cancelling over-ear headphones.",
    price: 4999,
    images: ["/images/electronics/headphones.jpg"],
    stockCount: 25,
    category: "electronics"
  }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log("Database seeded with sample products.");
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("Failed to seed database:", err);
  });
