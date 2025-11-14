const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { upload, handleUploadError } = require('../config/upload');

// Get all products
router.get('/', productController.getAllProducts);

// Get a single product by ID
router.get('/:id', productController.getProductById);

// Create a new product with file upload
router.post(
  '/',
  upload.single('image'), // 'image' is the field name in the form
  handleUploadError,      // Handle upload errors
  productController.createProduct
);

// Delete a product
router.delete('/:id', productController.deleteProduct);

module.exports = router;
