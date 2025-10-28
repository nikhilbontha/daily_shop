const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  banners: [String],
  featuredProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  announcements: [String],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.HomepageContent || mongoose.model('HomepageContent', schema);
