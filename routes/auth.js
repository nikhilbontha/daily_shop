const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Render Registration Page
router.get('/register', (req, res) => {
  res.render('auth/register', { error: null });
});

// Handle Registration Form Submit
router.post('/register', async (req, res) => {
  const { name, email, password, phone, city, pincode, nearby, state, country } = req.body;

  // Basic validation - required fields
  if (!name || !email || !password || !phone || !city || !pincode || !state || !country) {
    return res.render('auth/register', { error: 'Please fill in all required fields.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('auth/register', { error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      avatarUrl: '/images/default-avatar.png',
      phone,
      address: {
        city,
        pincode,
        nearby: nearby || '',
        state,
        country,
      },
    });

    await user.save();

    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: `${city}, ${state}, ${country}`,
      avatarUrl: user.avatarUrl,
    };

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('auth/register', { error: 'Something went wrong. Please try again.' });
  }
});

// Render Login Page
router.get('/login', (req, res) => {
  res.render('auth/login', { error: null });
});

// Handle Login Form Submit
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('auth/login', { error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('auth/login', { error: 'Invalid email or password' });
    }

    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      location: user.address
        ? `${user.address.city}, ${user.address.state}, ${user.address.country}`
        : '',
      avatarUrl: user.avatarUrl,
    };

    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    res.render('auth/login', { error: 'An error occurred. Please try again.' });
  }
});



// Handle Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.status(500).send('Failed to logout.');
    }
    res.redirect('/'); // Redirect to homepage after logout
  });
});

module.exports = router;
