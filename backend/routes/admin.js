const express = require('express');
const router = express.Router();

// Minimal admin router: admin UI removed. Return 404 on any admin routes.
module.exports = function adminRouterPlaceholder(/* adminAuth */) {
  router.all('*', (req, res) => res.status(404).json({ error: 'Admin interface removed' }));
  return router;
};
