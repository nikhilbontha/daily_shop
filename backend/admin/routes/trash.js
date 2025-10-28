const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// GET /admin/api/trash - list trashed files
router.get('/', async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const trashDir = path.join(uploadsDir, 'trash');
    if (!fs.existsSync(trashDir)) return res.json([]);
    const items = fs.readdirSync(trashDir).map(name => {
      const p = path.join(trashDir, name);
      const stat = fs.statSync(p);
      return { name, path: `/admin/static/uploads/trash/${name}`, size: stat.size, deletedAt: stat.mtime };
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/api/trash/restore { name }
router.post('/restore', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const trashDir = path.join(uploadsDir, 'trash');
    const src = path.join(trashDir, name);
    const dest = path.join(uploadsDir, name);
    if (!fs.existsSync(src)) return res.status(404).json({ error: 'Not found' });
    fs.renameSync(src, dest);

    // If we have a TrashedFile record, re-associate with products
    try {
      const TrashedFile = require('../models/TrashedFile');
      const tf = await TrashedFile.findOne({ name }).lean();
      if (tf && tf.referencedProducts && tf.referencedProducts.length) {
        const Product = require('../../models/Product');
        for (const ref of tf.referencedProducts) {
          try {
            const prod = await Product.findById(ref.productId);
            if (!prod) continue;
            // ensure image url matches current static path
            const url = `/admin/static/uploads/${name}`;
            // insert at index if possible, otherwise push
            const idx = (typeof ref.index === 'number' && ref.index >= 0) ? ref.index : prod.images.length;
            prod.images = prod.images || [];
            // avoid duplicates
            if (!prod.images.includes(url)) {
              prod.images.splice(Math.min(idx, prod.images.length), 0, url);
              await prod.save();
            }
          } catch (e) { }
        }
        // remove the TrashedFile record
        await require('../models/TrashedFile').deleteOne({ name }).catch(()=>{});
      }
    } catch (e) {
      // ignore model errors
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/api/trash/:name - remove single file permanently
router.delete('/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const trashDir = path.join(uploadsDir, 'trash');
    const p = path.join(trashDir, name);
    if (!fs.existsSync(p)) return res.status(404).json({ error: 'Not found' });
    fs.unlinkSync(p);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/api/trash - purge all optionally older than days query param
router.delete('/', async (req, res) => {
  try {
    const days = parseInt(req.query.days || '0', 10);
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const trashDir = path.join(uploadsDir, 'trash');
    if (!fs.existsSync(trashDir)) return res.json({ success: true, deleted: 0 });
    const now = Date.now();
    let deleted = 0;
    fs.readdirSync(trashDir).forEach(name => {
      const p = path.join(trashDir, name);
      const stat = fs.statSync(p);
      const ageDays = (now - stat.mtimeMs) / (1000 * 60 * 60 * 24);
      if (!days || ageDays >= days) {
        try { fs.unlinkSync(p); deleted++; } catch (e) { }
      }
    });
    res.json({ success: true, deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
