const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/checkout', paymentController.checkoutPage);
router.post('/create-order', paymentController.createOrder);
// Confirm UPI payment (dev/manual flow) - marks transaction and order as PAID
router.post('/confirm-upi', paymentController.confirmUpiPayment);

// Render payment page
router.get('/', (req, res) => {
	res.render('payment');
});

module.exports = router;
