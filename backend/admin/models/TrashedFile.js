const mongoose = require('mongoose');

const TrashedFileSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  originalPath: String,
  referencedProducts: [{ productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, index: Number }],
  trashedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TrashedFile', TrashedFileSchema, 'trashed_files');
