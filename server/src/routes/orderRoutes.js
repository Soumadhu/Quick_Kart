const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { body, param } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Create a new order (protected route - requires authentication)
router.post(
  '/',
  [
    authMiddleware,
    body('user_id').isUUID().withMessage('Valid user ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.product_id').isUUID().withMessage('Valid product ID is required for each item'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('total_amount').isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
    body('delivery_address').isObject().withMessage('Delivery address is required')
  ],
  orderController.createOrder
);

// Admin accepts an order (protected route - requires admin)
router.post(
  '/:orderId/accept',
  [
    authMiddleware,
    adminMiddleware,
    param('orderId').isUUID().withMessage('Valid order ID is required')
  ],
  orderController.acceptOrder
);

// Admin rejects an order (protected route - requires admin)
router.post(
  '/:orderId/reject',
  [
    authMiddleware,
    adminMiddleware,
    param('orderId').isUUID().withMessage('Valid order ID is required'),
    body('reason').notEmpty().withMessage('Rejection reason is required')
  ],
  orderController.rejectOrder
);

// Get all orders for admin (protected route - requires admin)
router.get(
  '/',
  [
    authMiddleware,
    adminMiddleware
  ],
  orderController.getOrdersForAdmin
);

// Get order by ID (protected route - user can see their own order, admin can see any order)
router.get(
  '/:orderId',
  [
    authMiddleware,
    param('orderId').isUUID().withMessage('Valid order ID is required')
  ],
  orderController.getOrderById
);

// Get orders for admin (protected route - requires admin)
router.get(
  '/',
  [
    authMiddleware,
    adminMiddleware
  ],
  orderController.getOrdersForAdmin
);

module.exports = router;
