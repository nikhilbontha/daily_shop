const mongoose = require('mongoose');
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  images: [String],
  stockCount: Number,
  category: String
});
module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);
