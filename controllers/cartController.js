const User = require('../models/user');
const Product = require('../models/Product');

exports.getCart = async (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  try {
    const user = await User.findById(req.session.userId).populate('cart.productId');
    res.render('cart', { cartItems: user.cart });
  } catch (error) {
    res.status(500).send('Server error');
  }
};

exports.addToCart = async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Login required');
  const { productId } = req.body;
  try {
    const user = await User.findById(req.session.userId);
    const idx = user.cart.findIndex(i => i.productId.toString() === productId);
    (idx > -1) ? user.cart[idx].quantity++ : user.cart.push({ productId, quantity: 1 });
    await user.save();
    res.redirect('/cart');
  } catch (error) {
    res.status(500).send('Server error');
  }
};

exports.removeFromCart = async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Login required');
  const { productId } = req.body;
  try {
    const user = await User.findById(req.session.userId);
    user.cart = user.cart.filter(i => i.productId.toString() !== productId);
    await user.save();
    res.redirect('/cart');
  } catch (error) {
    res.status(500).send('Server error');
  }
};
