require('dotenv').config();
const connectDB = require('./config/db');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const testRoute = require('./testRoute');

// We'll initialize DB and session store inside startServer() so the server
// only mounts routes after we know whether a DB client is available.

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

// Session setup will be initialized after we attempt the DB connection so
// that the session store is only created when a usable client exists.

// Static files
app.use(express.static('public'));

// Set EJS as view engine
app.set('view engine', 'ejs');

// Route modules (import-only here; mounting happens after session setup)
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
const debugRoutes = require('./routes/debug');

// We'll mount session-dependent routes inside startServer() after session middleware is registered.

// Global error handler
function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
}
app.use(errorHandler);

// Start server function that ensures DB connection and session store setup
async function startServer() {
  try {
    // Require MONGO_URI for Atlas-only deployments. Abort early if missing.
    if (!process.env.MONGO_URI || process.env.MONGO_URI.trim() === '') {
      console.error('\u274c ERROR: MONGO_URI is not set. This application requires a MongoDB Atlas connection string in MONGO_URI.');
      console.error('Copy .env.example to .env and set MONGO_URI, or set the environment variable in your deploy platform.');
      process.exit(1);
    }

    // Retry connectDB with exponential backoff if it fails. This helps transient
    // network/Atlas propagation issues while still enforcing Atlas-only mode.
    const maxRetries = parseInt(process.env.DB_CONNECT_RETRIES || '5', 10);
    const baseDelay = parseInt(process.env.DB_CONNECT_BASE_DELAY_MS || '1000', 10);
    let attempt = 0;
    let mongoClient = null;
    while (attempt <= maxRetries) {
      attempt += 1;
      mongoClient = await connectDB();
      if (mongoClient) break;
      if (!(process.env.MONGO_URI && process.env.MONGO_URI.trim() !== '')) break; // nothing to retry if no URI
      if (attempt > maxRetries) break;
      const wait = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`DB connection attempt ${attempt} failed. Retrying in ${wait}ms...`);
      await new Promise((r) => setTimeout(r, wait));
    }

    // If user explicitly set MONGO_URI but we couldn't connect after retries, abort startup.
    if (process.env.MONGO_URI && process.env.MONGO_URI.trim() !== '' && !mongoClient) {
      console.error('ERROR: MONGO_URI is set but the application could not connect to MongoDB Atlas after retries.');
      console.error('Please ensure your Atlas cluster allows connections from this IP and that the URI/credentials are correct.');
      process.exit(1);
    }

    // Session setup - must be before route access to req.session
    const sessionOptions = {
      secret: process.env.SESSION_SECRET || 'your_secret_key',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
    };

    try {
      if (mongoClient) {
        sessionOptions.store = MongoStore.create({ client: mongoClient });
        console.log('✅ Session store initialized with MongoDB client');
      } else {
        if (process.env.MONGO_URI && process.env.MONGO_URI.trim() !== '') {
          console.warn('⚠️ MONGO_URI is set but DB client is not connected. Sessions will use in-memory store until the DB connects.');
        } else {
          console.warn('⚠️ WARNING: No MongoDB client or MONGO_URI provided. Sessions will use the default in-memory store which is not suitable for production.');
        }
      }
    } catch (err) {
      console.error('Failed to initialize session store:', err && err.message ? err.message : err);
    }

    app.use(session(sessionOptions));

    // Middleware to make user, cartCount, and location available in all views
    app.use((req, res, next) => {
      res.locals.user = req.session && req.session.user ? req.session.user : null;
      // cart may store strings or objects { productId, qty }
      if (!req.session || !req.session.cart) {
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
      res.locals.location = req.session && req.session.user ? req.session.user.location : null;
      next();
    });

    // Dedicated route for /auth/account page (requires session)
    app.get('/auth/account', (req, res) => {
      res.render('auth/account', { user: req.session && req.session.user ? req.session.user : null });
    });

    // Ensure /profile route is complete (requires session)
    app.get('/profile', (req, res) => {
      if (!req.session || !req.session.user) {
        return res.redirect('/auth/login');
      }
      res.render('profile', { user: req.session.user });
    });

    // The root route is provided by `homeRoutes` (mounted below) which supplies `products`.

    // Mount routes now that session middleware is in place
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
    app.use('/api/test', testRoute);
    app.use('/api/debug', debugRoutes);

    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  } catch (e) {
    console.error('Fatal error during startup:', e && e.stack ? e.stack : e);
    process.exit(1);
  }
}

// Global error handlers
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  // Optional: process.exit(1);
});

// Kick off server start
startServer();
