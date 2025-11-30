const db = require('../config/db');
const { raw } = require('express');
const path = require('path');
const fs = require('fs');

// Helper function to get full image URL
const getFullImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Otherwise, construct the full URL
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:5000';
  return `${protocol}://${host}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DEBUG] Fetching product with ID: ${id}`);
    
    // Check if the products table exists and get the product
    const product = await db('products').where({ id }).first();
    
    if (!product) {
      console.log(`[DEBUG] No product found with ID: ${id}`);
      return res.status(404).json({ error: 'Product not found' });
    }
    console.log(`[DEBUG] Product query result:`, product);
    
    if (!product) {
      console.log(`[DEBUG] No product found with ID: ${id}`);
      return res.status(404).json({ error: 'Product not found' });
    }

    // Ensure the image URL is a full URL
    product.image_url = getFullImageUrl(req, product.image_url);
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product',
      details: error.message 
    });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await db('products').select('*');
    
    // Update image URLs to be full URLs
    const productsWithFullUrls = products.map(product => ({
      ...product,
      image_url: getFullImageUrl(req, product.image_url)
    }));
    
    res.json(productsWithFullUrls);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    console.log('=== New Product Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Uploaded file info:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      destination: req.file.destination,
      filename: req.file.filename,
      path: req.file.path
    } : 'No file uploaded');

    // Validate required fields
    if (!req.body.name || req.body.price === undefined) {
      console.error('Validation failed: Name and price are required');
      return res.status(400).json({ 
        error: 'Name and price are required fields',
        received: {
          name: req.body.name,
          price: req.body.price
        }
      });
    }

    // Parse and validate input data
    const name = req.body.name ? req.body.name.toString().trim() : '';
    const description = req.body.description ? req.body.description.toString().trim() : '';
    const price = parseFloat(req.body.price);
    const stock = parseInt(req.body.stock, 10) || 0;
    const unit = req.body.unit || 'pcs';
    const originalPrice = req.body.originalPrice ? parseFloat(req.body.originalPrice) : null;
    const rating = parseFloat(req.body.rating) || 0;
    const deliveryTime = req.body.deliveryTime || '';
    const category = req.body.category || '1';

    if (isNaN(price) || price <= 0) {
      console.error('Validation failed: Invalid price', { price: req.body.price });
      return res.status(400).json({ 
        error: 'Invalid price. Must be a positive number.',
        received: req.body.price
      });
    }

    // Handle file upload if present
    let imagePath = null;
    let imageUrl = null;
    
    if (req.file) {
      try {
        // Verify the file was saved successfully
        const fs = require('fs');
        const path = require('path');
        const fullPath = path.join(req.file.destination, req.file.filename);
        
        if (!fs.existsSync(fullPath)) {
          console.error('File was not saved to disk:', fullPath);
          throw new Error('Failed to save uploaded file');
        }
        
        // Store the relative path for database
        imagePath = `/uploads/${req.file.filename}`;
        
        // Generate public URL
        const protocol = req.protocol || 'http';
        const host = req.get('host') || 'localhost:5000';
        imageUrl = `${protocol}://${host}${imagePath}`;
        
        console.log('File uploaded successfully:', {
          path: imagePath,
          url: imageUrl
        });
      } catch (fileError) {
        console.error('Error handling uploaded file:', fileError);
        return res.status(500).json({ 
          error: 'Failed to process uploaded file',
          details: fileError.message 
        });
      }
    }

    // Prepare values for insertion
    const values = [
      name,
      description,
      price,
      originalPrice,
      unit,
      imageUrl || imagePath, // Use full URL if available, fallback to path
      stock,
      rating,
      deliveryTime,
      category
    ];

    console.log('Attempting to insert product with values:', values);

    try {
      // Insert the product
      const insertQuery = `
        INSERT INTO products (
          name, description, price, original_price, unit, 
          image_url, stock, rating, delivery_time, category, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;
      
      console.log('Executing query:', insertQuery);
      console.log('With values:', values);
      
      const result = await db.query(insertQuery, values);
      
      // For SQLite, the lastID is in the result object
      const lastID = result.lastID || (result[0] && result[0].lastID) || (result.insertId);
      
      if (!lastID) {
        console.error('No lastID returned from database. Result:', result);
        // Try to get the last inserted ID manually
        const lastRow = await db.query('SELECT last_insert_rowid() as lastID');
        const manualLastID = lastRow && lastRow[0] && lastRow[0].lastID;
        
        if (!manualLastID) {
          throw new Error('Could not determine the ID of the newly inserted product');
        }
        
        console.log('Using manual lastID:', manualLastID);
        
        // Get the newly created product with the manual ID
        const [product] = await db.query('SELECT * FROM products WHERE id = ?', [manualLastID]);
        if (product && product.image_url) {
          product.image_url = `http://localhost:5000${product.image_url}`;
        }
        return res.status(201).json(product);
      }
      
      console.log('Product inserted successfully, ID:', lastID);
      
      // Get the newly created product
      const [product] = await db.query('SELECT * FROM products WHERE id = ?', [lastID]);
      
      if (!product) {
        throw new Error('Failed to retrieve the created product from database');
      }
      
      // Ensure the image URL is a full URL
      product.image_url = getFullImageUrl(req, product.image_url);
      
      console.log('Product created successfully:', product);
      return res.status(201).json(product);
      
    } catch (dbError) {
      console.error('Database error:', {
        message: dbError.message,
        code: dbError.code,
        sql: dbError.sql,
        stack: dbError.stack
      });
      
      // Handle specific SQLite errors
      if (dbError.code === 'SQLITE_ERROR') {
        return res.status(400).json({
          error: 'Database error',
          message: dbError.message,
          details: 'There was an error saving the product to the database.'
        });
      }
      
      throw dbError; // Re-throw for the outer catch block
    }
  } catch (error) {
    console.error('Unexpected error in createProduct:', {
      message: error.message,
      stack: error.stack,
      error: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request.',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        stack: error.stack
      })
    });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db('products').where({ id }).del();
    
    if (deleted === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      error: 'Failed to delete product', 
      details: error.message 
    });
  }
};
