const multer = require('multer');
const path = require('path');

// Set up multer for profile photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/images/avatars'));
  },
  filename: function (req, file, cb) {
    cb(null, req.session.user._id + path.extname(file.originalname));
  }
});
const upload = multer({ storage });
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Edit profile page
router.get('/profile/edit', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  try {
    const user = await User.findById(req.session.user._id).lean();
    if (!user) {
      return res.redirect('/auth/login');
    }
  res.render('auth/editProfile', { user });
  } catch (error) {
    console.error(error);
    res.redirect('/profile');
  }
});

// Handle profile update
router.post('/profile/edit', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  try {
    const fs = require('fs');
    const avatarsDir = path.join(__dirname, '../public/images/avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }
    upload.single('avatar')(req, res, async function (err) {
      if (err) {
        console.error(err);
        return res.redirect('/profile/edit');
      }
      const { name, surname, email, dateOfBirth, gender, pincode, city, state, country } = req.body;
      let avatarUrl = req.session.user.avatarUrl;
      if (req.file) {
        avatarUrl = '/images/avatars/' + req.file.filename;
      }
      const address = {
        ...req.session.user.address,
        pincode,
        city,
        state,
        country
      };
      await User.findByIdAndUpdate(req.session.user._id, {
        name, surname, email, dateOfBirth, gender, avatarUrl,
        address
      });
      req.session.user.name = name;
      req.session.user.surname = surname;
      req.session.user.email = email;
      req.session.user.dateOfBirth = dateOfBirth;
      req.session.user.gender = gender;
      req.session.user.avatarUrl = avatarUrl;
      req.session.user.address = address;
      res.redirect('/profile');
    });
  } catch (error) {
    console.error(error);
    res.redirect('/profile/edit');
  }
});


router.get('/profile', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  try {
    const user = await User.findById(req.session.user._id).lean();
    if (!user) {
      return res.redirect('/auth/login');
    }
    res.render('profile', { user }); // Pass full user object to view
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});
module.exports = router;
