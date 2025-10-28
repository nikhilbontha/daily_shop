const User = require('../models/User');
const Product = require('../models/Product');
const ReturnRequest = require('../models/ReturnRequest');
// Payment model may be custom; fallback to Order or Payment controller
const Order = require('../models/Order');

exports.dashboard = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    res.render('admin/dashboard', { userCount, productCount, orderCount });
  } catch (e) {
    console.error('Admin dashboard error:', e);
    res.render('admin/dashboard', { userCount: 0, productCount: 0, orderCount: 0 });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().limit(200).lean();
    res.render('admin/users', { users });
  } catch (e) {
    console.error('Admin listUsers error:', e);
    res.render('admin/users', { users: [] });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin/users');
  } catch (e) {
    console.error('deleteUser error:', e);
    res.status(500).send('Failed');
  }
};

exports.listProducts = async (req, res) => {
  try {
    const products = await Product.find().limit(200).lean();
    res.render('admin/products', { products });
  } catch (e) {
    console.error('listProducts error:', e);
    res.render('admin/products', { products: [] });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/admin/products');
  } catch (e) {
    console.error('deleteProduct error:', e);
    res.status(500).send('Failed');
  }
};

exports.listPayments = async (req, res) => {
  try {
    const payments = await Order.find().limit(200).lean();
    res.render('admin/payments', { payments });
  } catch (e) {
    console.error('listPayments error:', e);
    res.render('admin/payments', { payments: [] });
  }
};

exports.listReturns = async (req, res) => {
  try {
    const returns = await ReturnRequest.find().limit(200).lean();
    res.render('admin/returns', { returns });
  } catch (e) {
    console.error('listReturns error:', e);
    res.render('admin/returns', { returns: [] });
  }
};

exports.editHome = async (req, res) => {
  // Placeholder: load home configuration if any
  res.render('admin/home', { message: null });
};
