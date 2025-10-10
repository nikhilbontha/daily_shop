const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/checkout', paymentController.checkoutPage);
router.post('/create-order', paymentController.createOrder);

// Render payment page
router.get('/', (req, res) => {
	res.render('payment');
});

module.exports = router;
