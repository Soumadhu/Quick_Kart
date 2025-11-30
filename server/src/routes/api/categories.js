// File updated: 2025-11-15 19:00:00 - Force nodemon restart
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../../public/uploads/categories');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for category image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `category-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('File received:', file);
  console.log('File mimetype:', file.mimetype);
  console.log('File originalname:', file.originalname);
  
  // Accept only image files - check both mimetype and extension
  const isImageByMimetype = file.mimetype && file.mimetype.startsWith('image/');
  const isImageByExtension = file.originalname && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.originalname);
  
  if (isImageByMimetype || isImageByExtension) {
    cb(null, true);
  } else {
    console.log('File rejected - not an image');
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

function createCategoryRoutes(db) {
  const CategoryController = require('../../controllers/categoryController');
  
  // Ensure db is properly initialized
  if (!db) {
    console.error('Database connection not provided to createCategoryRoutes');
    throw new Error('Database connection is required');
  }
  
  const categoryController = new CategoryController(db);
  const router = express.Router();
  
  // Log route registration
  console.log('Initializing category routes with database connection');

  // GET /api/categories - Get all categories
  router.get('/', (req, res) => {
    console.log('GET /api/categories request received');
    categoryController.getCategories(req, res).catch(error => {
      console.error('Error in GET /api/categories:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Failed to fetch categories',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    });
  });

  // GET /api/categories/:id - Get category by ID
  router.get('/:id', categoryController.getCategoryById.bind(categoryController));

  // POST /api/categories - Create new category
  router.post('/', upload.single('image'), categoryController.createCategory.bind(categoryController));

  // PUT /api/categories/:id - Update category
  router.put('/:id', upload.single('image'), categoryController.updateCategory.bind(categoryController));

  // DELETE /api/categories/:id - Delete category
  router.delete('/:id', categoryController.deleteCategory.bind(categoryController));

  // GET /api/categories/test - Test database connection and list categories
  router.get('/test', async (req, res) => {
    try {
      const db = require('../../config/db');
      const sqlite3 = require('sqlite3').verbose();
      const path = require('path');
      
      // Test direct database connection
      const dbPath = path.join(__dirname, '../../../data/quickkart.sqlite3');
      console.log('Test endpoint - Database path:', dbPath);
      
      const testDb = new sqlite3.Database(dbPath);
      
      testDb.all("SELECT * FROM categories", (err, rows) => {
        if (err) {
          console.error('Test endpoint error:', err);
          return res.status(500).json({ 
            error: 'Database query failed',
            details: err.message,
            dbPath
          });
        }
        
        console.log('Test endpoint - Categories found:', rows.length);
        
        res.json({
          message: 'Database connection successful',
          dbPath,
          categories: rows,
          count: rows.length
        });
        
        testDb.close();
      });
    } catch (error) {
      console.error('Test endpoint error:', error);
      res.status(500).json({ 
        error: 'Test failed',
        details: error.message
      });
    }
  });

  // GET /api/categories/uploads - List all uploaded category images
  router.get('/uploads', (req, res) => {
    try {
      const fs = require('fs');
      const files = fs.readdirSync(uploadsDir);
      res.json({
        uploadsDir,
        files: files.map(file => ({
          name: file,
          path: path.join(uploadsDir, file),
          url: `/uploads/categories/${file}`,
          exists: fs.existsSync(path.join(uploadsDir, file))
        }))
      });
    } catch (error) {
      console.error('Error reading category uploads directory:', error);
      res.status(500).json({ 
        error: 'Failed to read category uploads directory',
        details: error.message,
        uploadsDir
      });
    }
  });

  return router;
}

module.exports = createCategoryRoutes;
