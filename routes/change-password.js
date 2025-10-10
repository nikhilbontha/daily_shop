const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');

// Render change password page
router.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  res.render('change-password');
});

// Handle password change
router.post('/', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.session.user._id);
  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) {
    return res.render('change-password', { error: 'Old password is incorrect.' });
  }
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.render('change-password', { success: 'Password changed successfully.' });
});

module.exports = router;
