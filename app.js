require('dotenv').config();
const connectDB = require('./config/db');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const testRoute = require('./testRoute');

connectDB();

const app = express();

// Security and performance middlewares
app.use(helmet());
app.use(cors()); // Configure origins properly in production

app.use(express.json({ limit: '10kb' }));
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // Increased from 100 to 300 requests per minute
});
app.use(limiter);

// Body parsers
app.use(express.urlencoded({ extended: true }));

// Session setup - must be before route access to req.session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

// Static files
app.use(express.static('public'));

// Middleware to make user, cartCount, and location available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  // cart may store strings or objects { productId, qty }
  if (!req.session.cart) {
    res.locals.cartCount = 0;
  } else {
    try {
      res.locals.cartCount = req.session.cart.reduce((sum, c) => {
        if (!c) return sum;
        if (typeof c === 'string') return sum + 1;
        if (typeof c === 'object' && c.qty) return sum + (parseInt(c.qty, 10) || 0);
        return sum + 1;
      }, 0);
    } catch (e) {
      res.locals.cartCount = Array.isArray(req.session.cart) ? req.session.cart.length : 0;
    }
  }
  res.locals.location = req.session.user ? req.session.user.location : null;
  next();
});

// Set EJS as view engine
app.set('view engine', 'ejs');

// Route imports and mount
// Route imports and mount (CommonJS)
const authRoutes = require('./routes/auth');
const homeRoutes = require('./routes/home');
const categoryRoutes = require('./routes/category');
const searchRoutes = require('./routes/search');
const productsRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const profileRoutes = require('./routes/profile');
const paymentRoutes = require('./routes/payment');
const returnsRoutes = require('./routes/returns');
const reviewsRoutes = require('./routes/reviews');
const wishlistRoutes = require('./routes/wishlist');
const changePasswordRoutes = require('./routes/change-password');
const paymentApiRoutes = require('./routes/payment');
const orderRoutes = require('./routes/order');
const checkoutRoutes = require('./routes/checkout');

app.use('/auth', authRoutes);
app.use('/', homeRoutes);
app.use('/category', categoryRoutes);
app.use('/search', searchRoutes);
app.use('/products', productsRoutes);
app.use('/cart', cartRoutes);
app.use('/', profileRoutes);
app.use('/api/payment', paymentApiRoutes);
app.use('/returns', returnsRoutes);
app.use('/reviews', reviewsRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/change-password', changePasswordRoutes);
app.use('/', orderRoutes);
app.use('/', checkoutRoutes);
app.use('/payment', paymentRoutes);

// Test route for Render health check
app.use('/api/test', testRoute);


// Dedicated route for /auth/account page
app.get('/auth/account', (req, res) => {
  res.render('auth/account', { user: req.session.user || null });
});

// Checkout route is provided by routes/checkout.js
// (mounted below)

// Ensure /profile route is complete
app.get('/profile', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  res.render('profile', { user: req.session.user });
});

// Home route example passing location etc (if needed in addition to middleware)
app.get('/', (req, res) => {
  res.render('home', {
    user: req.session.user,
    location: req.session.user ? req.session.user.location : null,
    cartCount: req.session.cart ? req.session.cart.length : 0,
  });
});

// Global error handler
function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
}
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
