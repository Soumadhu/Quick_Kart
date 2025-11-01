const express = require('express');
const { body } = require('express-validator');
const { createOrder, verifyPayment, getKey } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/payments/create-order
// @desc    Create a new Razorpay order
// @access  Private
router.post(
  '/create-order',
  [
    protect,
    body('amount', 'Amount is required').isNumeric().notEmpty(),
    body('currency', 'Invalid currency').optional().isString(),
    body('receipt', 'Receipt ID is required').optional().isString()
  ],
  createOrder
);

// @route   POST /api/payments/verify
// @desc    Verify payment signature
// @access  Private
router.post(
  '/verify',
  [
    protect,
    body('razorpay_order_id', 'Order ID is required').notEmpty(),
    body('razorpay_payment_id', 'Payment ID is required').notEmpty(),
    body('razorpay_signature', 'Signature is required').notEmpty()
  ],
  verifyPayment
);

// @route   GET /api/payments/get-key
// @desc    Get Razorpay key
// @access  Private
router.get('/get-key', protect, getKey);

module.exports = router;
