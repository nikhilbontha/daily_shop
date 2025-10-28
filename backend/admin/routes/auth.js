const express = require('express');
module.exports = function(upload){
  const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');

  // POST /admin/api/auth/login
  router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await admin.verifyPassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    req.session.isAdmin = true;
    req.session.adminEmail = admin.email;
    res.json({ success: true, email: admin.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  });

  // POST /admin/api/auth/logout
  router.post('/logout', (req, res) => {
    req.session.isAdmin = false;
    req.session.adminEmail = null;
    res.json({ success: true });
  });

  // GET /admin/api/auth/status
  router.get('/status', async (req, res) => {
    try{
      const isAdmin = !!(req.session && req.session.isAdmin);
      const email = req.session && req.session.adminEmail;
      let avatar = null;
      if(email){
        const Admin = require('../models/Admin');
        const a = await Admin.findOne({ email }).lean();
        if(a && a.avatar) avatar = a.avatar;
      }
      res.json({ isAdmin, email, avatar });
    }catch(e){ res.status(500).json({ error: e.message }); }
  });

// Utility route (dev): create initial admin if none exists
router.post('/init', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email+password required' });
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Admin exists' });
    const hash = await bcrypt.hash(password, 10);
    const a = new Admin({ email, passwordHash: hash });
    await a.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

  // Avatar upload endpoint: POST /admin/api/auth/avatar
  // uses upload.single('avatar') to receive file and stores path in Admin.avatar
  router.post('/avatar', upload.single('avatar'), async (req, res) => {
    try{
      if(!req.session || !req.session.adminEmail) return res.status(401).json({ error: 'Unauthorized' });
      if(!req.file) return res.status(400).json({ error: 'No file' });
      const Admin = require('../models/Admin');
      const email = req.session.adminEmail;
      const fs = require('fs');
      const path = require('path');
      const crypto = require('crypto');
      // build deterministic filename: md5(email) + ext
      const ext = path.extname(req.file.filename) || path.extname(req.file.originalname) || '.jpg';
      const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
      const newName = `avatar-${hash}${ext}`;
      const uploadDir = path.join(__dirname, '..', 'uploads');
      const oldPath = path.join(uploadDir, req.file.filename);
      const newPath = path.join(uploadDir, newName);
      try{ fs.renameSync(oldPath, newPath); } catch(e) { /* rename failed - ignore */ }
      const avatarPath = `/admin/static/uploads/${newName}`;
      await Admin.findOneAndUpdate({ email }, { $set: { avatar: avatarPath } });
      res.json({ success:true, avatar: avatarPath });
    }catch(e){ res.status(500).json({ error: e.message }); }
  });

  // POST /admin/api/auth/update - update email and/or password
  router.post('/update', async (req, res) => {
    try{
      if(!req.session || !req.session.adminEmail) return res.status(401).json({ error: 'Unauthorized' });
      const { email, password } = req.body;
      const Admin = require('../models/Admin');
      const current = await Admin.findOne({ email: req.session.adminEmail });
      if(!current) return res.status(404).json({ error: 'Admin not found' });
      const update = {};
      if(email && typeof email === 'string' && email.trim() !== '' && email !== current.email) {
        // ensure not clobbering existing admin
        const exists = await Admin.findOne({ email });
        if(exists) return res.status(400).json({ error: 'Email already in use' });
        update.email = email;
      }
      if(password && typeof password === 'string' && password.trim() !== ''){
        const bcrypt = require('bcrypt');
        const hash = await bcrypt.hash(password, 10);
        update.passwordHash = hash;
      }
      if(Object.keys(update).length) {
        await Admin.findByIdAndUpdate(current._id, update);
        if(update.email) req.session.adminEmail = update.email;
      }
      res.json({ success:true, email: req.session.adminEmail });
    }catch(e){ res.status(500).json({ error: e.message }); }
  });

  return router;
};

// Avatar upload endpoint (expects multipart form-data with field 'avatar')
// Note: The admin server mounts routes with multer already available in server.js;
// to use multer here we will attempt to require the upload middleware from server context.

