const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query, run } = require('../../config/db');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '../../../server/public/uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory at: ${uploadsDir}`);
}

// Ensure public directory is served
const publicDir = path.join(__dirname, '../../../server/public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log(`Created public directory at: ${publicDir}`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Helper function to get base URL for image URLs
const getBaseUrl = () => {
  // Always use the server's IP address instead of relying on the host header
  return 'http://192.168.0.102:5000';
};

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await query(`
      SELECT id, name, description, price, original_price as originalPrice, 
             unit, image_url as imageUrl, stock, rating, delivery_time as deliveryTime,
             created_at as createdAt, updated_at as updatedAt
      FROM products
      ORDER BY created_at DESC
    `);
    
    // Get base URL for image URLs
    const baseUrl = getBaseUrl();
    
    const productsWithFullUrls = products.map(product => ({
      ...product,
      imageUrl: product.imageUrl ? 
        `${baseUrl}${product.imageUrl.startsWith('/') ? '' : '/'}${product.imageUrl.replace(/^\/+/, '')}` : 
        null,
      // Ensure consistent property names
      originalPrice: product.originalPrice || null,
      deliveryTime: product.deliveryTime || '30-45 min'
    }));
    
    res.json(productsWithFullUrls);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
});

// Get a single product by ID
router.get('/:id(\\d+)', async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    console.log(`Fetching product with ID: ${productId}`);
    
    const [product] = await query(
      `SELECT id, name, description, price, original_price as originalPrice, 
              unit, image_url as imageUrl, stock, rating, delivery_time as deliveryTime,
              created_at as createdAt, updated_at as updatedAt
       FROM products 
       WHERE id = ?`, 
      [productId]
    );

    if (!product) {
      console.log(`Product with ID ${productId} not found`);
      return res.status(404).json({ error: 'Product not found' });
    }

    // Convert image path to full URL
    const baseUrl = getBaseUrl();
    const productWithFullUrl = {
      ...product,
      imageUrl: product.imageUrl ? 
        `${baseUrl}${product.imageUrl.startsWith('/') ? '' : '/'}${product.imageUrl.replace(/^\/+/, '')}` : 
        null,
      originalPrice: product.originalPrice || null,
      deliveryTime: product.deliveryTime || '30-45 min'
    }; 

    res.json(productWithFullUrl);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product', details: error.message });
  }
});

// Create a new product with image upload
router.post('/', upload.single('image'), async (req, res) => {
  let imageUrl = null;
  
  try {
    const { name, description, price, originalPrice, unit, stock } = req.body;
    
    if (!name || !price) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Name and price are required' });
    }
    
    // Handle image upload if present
    if (req.file) {
      // Store just the filename, we'll build the full URL when serving
      imageUrl = `/uploads/${req.file.filename}`;
      console.log('File uploaded to:', req.file.path);
    }
    
    const result = await run(
      `INSERT INTO products 
       (name, description, price, original_price, unit, image_url, stock, rating, delivery_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        parseFloat(price),
        originalPrice ? parseFloat(originalPrice) : null,
        unit || 'pcs',
        imageUrl,
        parseInt(stock || 0, 10),
        0, // Default rating
        '30-45 min' // Default delivery time
      ]
    );
    
    // Get the newly created product
    const newProducts = await query(
      `SELECT id, name, description, price, original_price as originalPrice, 
              unit, image_url as imageUrl, stock, rating, delivery_time as deliveryTime,
              created_at as createdAt, updated_at as updatedAt
       FROM products 
       WHERE id = ?`,
      [result.lastID]
    );
    
    if (newProducts.length === 0) {
      throw new Error('Failed to retrieve created product');
    }
    
    const newProduct = newProducts[0];
    
    // Convert image path to full URL
    if (newProduct.imageUrl) {
      // Ensure the URL is absolute
      if (!newProduct.imageUrl.startsWith('http')) {
        newProduct.imageUrl = `${getBaseUrl()}${newProduct.imageUrl.startsWith('/') ? '' : '/'}${newProduct.imageUrl}`;
      }
    }
    
    // Ensure consistent property names
    newProduct.originalPrice = newProduct.originalPrice || null;
    newProduct.deliveryTime = newProduct.deliveryTime || '30-45 min';
    
    res.status(201).json(newProduct);
  } catch (error) {
    // Clean up uploaded file if there's an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error creating product:', error);
    res.status(500).json({ 
      error: 'Failed to create product',
      details: error.message 
    });
  }
});

// Update a product
router.put('/:id', upload.single('image'), async (req, res) => {
  let newImagePath = null;
  let oldImagePath = null;
  
  try {
    const { name, description, price, originalPrice, unit, stock } = req.body;
    
    // Get existing product to handle image deletion if needed
    const existingProducts = await query('SELECT image_url FROM products WHERE id = ?', [req.params.id]);
    if (existingProducts.length === 0) {
      // Clean up uploaded file if product not found
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const existingImage = existingProducts[0].image_url;
    let imageUrl = existingImage;
    
    // If a new image is uploaded
    if (req.file) {
      newImagePath = req.file.path;
      imageUrl = `/uploads/${req.file.filename}`;
      console.log('New image uploaded to:', newImagePath);
      
      // Mark old image for deletion if it exists
      if (existingImage) {
        oldImagePath = path.join(__dirname, '../../..', existingImage);
        console.log('Old image marked for deletion:', oldImagePath);
      }
    }
    
    await run(
      `UPDATE products 
       SET name = ?, description = ?, price = ?, original_price = ?, 
           unit = ?, image_url = ?, stock = ?
       WHERE id = ?`,
      [
        name,
        description || null,
        parseFloat(price),
        originalPrice ? parseFloat(originalPrice) : null,
        unit || 'pcs',
        imageUrl,
        parseInt(stock || 0, 10),
        req.params.id
      ]
    );
    
    // Get updated product
    const updatedProducts = await query(
      `SELECT id, name, description, price, original_price as originalPrice, 
              unit, image_url as imageUrl, stock, rating, delivery_time as deliveryTime,
              created_at as createdAt, updated_at as updatedAt
       FROM products 
       WHERE id = ?`,
      [req.params.id]
    );
    
    if (updatedProducts.length === 0) {
      throw new Error('Failed to retrieve updated product');
    }
    
    const updatedProduct = updatedProducts[0];
    
    // Convert image path to full URL
    if (updatedProduct.imageUrl) {
      // Ensure the URL is absolute
      if (!updatedProduct.imageUrl.startsWith('http')) {
        updatedProduct.imageUrl = `${getBaseUrl()}${updatedProduct.imageUrl.startsWith('/') ? '' : '/'}${updatedProduct.imageUrl.replace(/^\/+/, '')}`;
        console.log('Updated product image URL:', updatedProduct.imageUrl);
      }
    }
    
    // Ensure consistent property names
    updatedProduct.originalPrice = updatedProduct.originalPrice || null;
    updatedProduct.deliveryTime = updatedProduct.deliveryTime || '30-45 min';
    
    // Clean up old image after successful update
    if (oldImagePath && fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath);
    }
    
    res.json(updatedProduct);
  } catch (error) {
    // Clean up new image if there was an error
    if (newImagePath && fs.existsSync(newImagePath)) {
      fs.unlinkSync(newImagePath);
    }
    
    console.error('Error updating product:', error);
    res.status(500).json({ 
      error: 'Failed to update product',
      details: error.message 
    });
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  try {
    // Get product to delete its image
    const products = await query('SELECT image_url FROM products WHERE id = ?', [req.params.id]);
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Delete the product
    await run('DELETE FROM products WHERE id = ?', [req.params.id]);
    
    // Delete the associated image if it exists
    const imageUrl = products[0].image_url;
    if (imageUrl) {
      const imagePath = path.join(__dirname, '../../', imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      error: 'Failed to delete product',
      details: error.message 
    });
  }
});

module.exports = router;
