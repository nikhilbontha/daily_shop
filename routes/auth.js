const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
let sendgrid = null;
if (process.env.SENDGRID_API_KEY) {
  try {
    sendgrid = require('@sendgrid/mail');
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
  } catch (e) {
    console.warn('SendGrid module not available or failed to initialize:', e && e.message ? e.message : e);
    sendgrid = null;
  }
}

// Redirect /auth to the login page so users don't see the intermediate selection page
router.get('/', (req, res) => {
  return res.redirect('/auth/login');
});

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
  const msg = req.session.resetMessage || null;
  req.session.resetMessage = null;
  res.render('auth/login', { error: null, message: msg });
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

// Render forgot password form
router.get('/forgot', (req, res) => {
  res.render('auth/forgot', { error: null, message: null });
});

// Handle forgot password submit
router.post('/forgot', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('auth/forgot', { error: 'No account with that email found.', message: null });
    }

    // create a token
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset/${token}`;
    // If SendGrid is configured, send an email; otherwise log the URL for development.
    if (sendgrid) {
      try {
        await sendgrid.send({
          to: user.email,
          from: process.env.SENDGRID_FROM || 'no-reply@example.com',
          subject: 'Password reset for DailyShop',
          text: `You requested a password reset. Click the link to reset: ${resetUrl}`,
          html: `<p>You requested a password reset. Click the link to reset:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
        });
      } catch (e) {
        console.error('SendGrid send error:', e && e.message ? e.message : e);
        console.log('Password reset link (fallback):', resetUrl);
      }
    } else {
      console.log('Password reset link (development):', resetUrl);
    }

    return res.render('auth/forgot', { error: null, message: 'If an account exists, a reset link has been generated. Check your email (or server logs in development).' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.render('auth/forgot', { error: 'An error occurred. Please try again.', message: null });
  }
});

// Render reset form
router.get('/reset/:token', async (req, res) => {
  try {
    const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) {
      return res.send('Password reset token is invalid or has expired.');
    }
    return res.render('auth/reset', { error: null, token: req.params.token });
  } catch (err) {
    console.error('Reset token error:', err);
    return res.send('An error occurred.');
  }
});

// Handle reset password submit
router.post('/reset/:token', async (req, res) => {
  const { password } = req.body;
  try {
    const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.send('Password reset token is invalid or has expired.');

    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

  // Do NOT auto-login after password reset; instead set a message and redirect to login
  req.session.resetMessage = 'Your password has been updated. Please sign in with your new password.';
  return res.redirect('/auth/login');
  } catch (err) {
    console.error('Reset submit error:', err);
    return res.send('An error occurred.');
  }
});

module.exports = router;
