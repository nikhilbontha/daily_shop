const path = require('path');
require('dotenv').config();
const express = require('express');
const connectDB = require('../config/db');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 2004;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static admin UI
app.use('/admin/static', express.static(path.join(__dirname, 'public')));
// Expose uploaded images
app.use('/admin/static/uploads', express.static(path.join(__dirname, 'uploads')));
// Also serve the main app public images so admin UI can show product images stored in the main public folder
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));

// File uploads for product images
const uploadDir = path.join(__dirname, 'uploads');
const fs = require('fs');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Connect DB and start server
async function start() {
  const client = await connectDB();

  // session store
  const sessionOptions = { secret: process.env.SESSION_SECRET || 'admin_secret', resave: false, saveUninitialized: false };
  if (client) sessionOptions.store = MongoStore.create({ client });
  app.use(session(sessionOptions));

  // Admin routes
  // auth routes (login/logout/status/init)
  app.use('/admin/api/auth', require('./routes/auth')(upload));

  // Protect API endpoints under /admin/api/* except /admin/api/auth
  app.use('/admin/api', (req, res, next) => {
    // allow auth routes
    if (req.path.startsWith('/auth')) return next();
    if (req.session && req.session.isAdmin) return next();
    return res.status(401).json({ error: 'Unauthorized' });
  });

  app.use('/admin/api/users', require('./routes/users'));
  app.use('/admin/api/products', require('./routes/products')(upload));
  app.use('/admin/api/orders', require('./routes/orders'));
  app.use('/admin/api/payments', require('./routes/payments'));
  // refunds endpoint
  app.use('/admin/api/payments/refund', require('./routes/refunds'));
  // trash management
  app.use('/admin/api/trash', require('./routes/trash'));
  // settings
  app.use('/admin/api/settings', require('./routes/settings'));
  app.use('/admin/api/returns', require('./routes/returns'));
  app.use('/admin/api/reviews', require('./routes/reviews'));
  app.use('/admin/api/homepage', require('./routes/homepage'));

  // debug endpoint: quick health + payments count
  app.get('/admin/api/debug', async (req, res) => {
    try {
      const mongoose = require('mongoose');
      const Payment = mongoose.models.Payment || mongoose.model('Payment', new mongoose.Schema({}, { strict: false }), 'payments');
      const count = await Payment.countDocuments().catch(()=>null);
      res.json({ ok: true, paymentsCount: count });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  // Serve single-page admin UI index
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  const PORT = process.env.ADMIN_PORT || 2004;
  app.listen(PORT, () => console.log(`Admin server running at http://localhost:${PORT}/admin`));
}

start().catch((err) => {
  console.error('Failed to start admin server', err);
  process.exit(1);
});
