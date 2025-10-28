const express = require('express');
const Product = require('../../models/Product');

module.exports = function (upload) {
  const router = express.Router();

  // GET all products
  router.get('/', async (req, res) => {
    try {
      const products = await Product.find().lean();
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET single
  router.get('/:id', async (req, res) => {
    try {
      const p = await Product.findById(req.params.id).lean();
      if (!p) return res.status(404).json({ error: 'Product not found' });
      res.json(p);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create product (with images)
  router.post('/', upload.array('images', 6), async (req, res) => {
    try {
      const uploaded = (req.files || []).map((f) => `/admin/static/uploads/${f.filename}`);
      // existingImages may be sent as existingImages[] fields
      let existing = req.body.existingImages || [];
      if (typeof existing === 'string') existing = [existing];
      const images = [...existing, ...uploaded];
      const data = Object.assign({}, req.body, { images });
      const prod = new Product(data);
      await prod.save();
      res.status(201).json(prod);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Update
  router.put('/:id', upload.array('images', 6), async (req, res) => {
    try {
      const uploaded = (req.files || []).map((f) => `/admin/static/uploads/${f.filename}`);
      let existing = req.body.existingImages || [];
      if (typeof existing === 'string') existing = [existing];
      // normalize existing image paths: extract filename and map to our static path
      existing = existing.map(s => {
        try {
          if (!s) return null;
          // if looks like full url
          if (s.startsWith('http://') || s.startsWith('https://')) {
            try { const u = new URL(s); s = u.pathname; } catch(e) { /* keep s */ }
          }
          // s might be like /admin/static/uploads/filename or full path; get basename
          const path = require('path');
          const fn = path.basename(s);
          return `/admin/static/uploads/${fn}`;
        } catch(e){ return s; }
      }).filter(Boolean);
      const images = [...existing, ...uploaded];
      // find current product to detect removed images
      const prodBefore = await Product.findById(req.params.id).lean();
  const update = Object.assign({}, req.body);
  // Only update images if the form explicitly provided existingImages or new files were uploaded
  const hasExistingField = Object.prototype.hasOwnProperty.call(req.body, 'existingImages');
  if (hasExistingField || (req.files && req.files.length)) update.images = images;
      const prod = await Product.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
      // delete files that were present before but are not in 'images' anymore
      if (prodBefore && prodBefore.images && Array.isArray(prodBefore.images)) {
        // normalize prodBefore images to filenames/static paths
        const path = require('path');
        const beforeImgs = prodBefore.images.map(i => {
          if (!i) return null;
          try {
            if (i.startsWith('http://') || i.startsWith('https://')) { const u = new URL(i); i = u.pathname; }
          } catch(e) {}
          return `/admin/static/uploads/${path.basename(i)}`;
        }).filter(Boolean);
  const removed = beforeImgs.filter(i => !images.includes(i));
  const fs = require('fs');
  const TrashedFile = require('../models/TrashedFile');
        removed.forEach((r) => {
          try {
            // r is like /admin/static/uploads/filename.ext
            const filename = path.basename(r);
            const p = path.join(__dirname, '..', 'uploads', filename);
            const trashDir = path.join(__dirname, '..', 'uploads', 'trash');
            if (!fs.existsSync(trashDir)) fs.mkdirSync(trashDir, { recursive: true });
            const dest = path.join(trashDir, filename);
            if (fs.existsSync(p)) fs.renameSync(p, dest);
            // determine index in original prodBefore.images by matching filename
            let idx = -1;
            for (let i = 0; i < prodBefore.images.length; i++) {
              try {
                const existingPath = prodBefore.images[i];
                const bn = path.basename(existingPath || '');
                if (bn === filename) { idx = i; break; }
              } catch (e) {}
            }
            // record in TrashedFile with reference to this product and index
            TrashedFile.findOneAndUpdate({ name: filename }, { $set: { originalPath: r }, $addToSet: { referencedProducts: { productId: prodBefore._id, index: idx } }, trashedAt: new Date() }, { upsert: true }).catch(()=>{});
          } catch (e) {
            // ignore move errors
            console.warn('Failed to move to trash', r, e && e.message);
          }
        });
      }
      if (!prod) return res.status(404).json({ error: 'Product not found' });
      res.json(prod);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Delete
  router.delete('/:id', async (req, res) => {
    try {
      await Product.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
