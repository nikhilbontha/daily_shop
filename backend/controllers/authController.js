const User = require('../models/User');
const bcrypt = require('bcrypt');

exports.showRegister = (req, res) => res.render('register');
exports.showLogin = (req, res) => res.render('login');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.send('User already exists');
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    req.session.userId = user._id;
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.send('Invalid email or password');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.send('Invalid email or password');
    req.session.userId = user._id;
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.logout = (req, res) => req.session.destroy(() => res.redirect('/auth/login'));
