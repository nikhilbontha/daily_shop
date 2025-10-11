const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  surname: String,
  email: String,
  password: String,
  avatarUrl: String,
  phone: String,
  dateOfBirth: {
    type: Date,
    set: function (val) {
      if (val == null || val === '') return undefined;
      if (val instanceof Date) return val;
      // Try to parse strings/numbers
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
    }
  },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  address: {
    city: String,
    pincode: String,
    nearby: String,
    state: String,
    country: String,
  },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  cart: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, default: 1 }
    }
  ]
  ,
  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
