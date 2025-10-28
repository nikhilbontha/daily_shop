#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Delete files older than N days from admin/uploads/trash
const days = parseInt(process.env.TRASH_RETENTION_DAYS || '30', 10);
const trashDir = path.join(__dirname, '..', 'uploads', 'trash');

if (!fs.existsSync(trashDir)) {
  console.log('Trash directory does not exist:', trashDir);
  process.exit(0);
}

const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
const files = fs.readdirSync(trashDir);
let removed = 0;
files.forEach(f => {
  const p = path.join(trashDir, f);
  try {
    const stat = fs.statSync(p);
    if (stat.mtimeMs < cutoff) {
      fs.unlinkSync(p);
      removed++;
    }
  } catch (e) {
    console.warn('Failed to remove', p, e && e.message);
  }
});
console.log('Removed', removed, 'files from trash');
