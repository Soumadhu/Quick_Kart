require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const createCategoryRoutes = require('./routes/api/categories');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
const publicPath = path.join(__dirname, '..', 'public');
const uploadsPath = path.join(publicPath, 'uploads');

console.log('Serving static files from:', publicPath);
console.log('Uploads directory:', uploadsPath);

// Serve static files from the public directory
app.use(express.static(publicPath));

// Explicitly serve the uploads directory
app.use('/uploads', express.static(uploadsPath));

// Add a route to test static file serving
app.get('/test-image', (req, res) => {
  res.sendFile(path.join(publicPath, 'test-image.jpg'));
});

// Add a route to test uploads directory access
app.get('/test-upload', (req, res) => {
  const testFile = path.join(uploadsPath, 'test.txt');
  require('fs').writeFileSync(testFile, 'Test file for uploads directory access');
  res.send('Test file created in uploads directory');
});

// API Routes
const apiRouter = express.Router();
apiRouter.use('/products', productRoutes);
apiRouter.use('/categories', createCategoryRoutes(db.knex()));
app.use('/api', apiRouter);

// List files in uploads directory
app.get('/list-uploads', (req, res) => {
  try {
    const fs = require('fs');
    const files = fs.readdirSync(uploadsPath);
    res.json({
      uploadsPath,
      files: files.map(file => ({
        name: file,
        path: path.join(uploadsPath, file),
        url: `/uploads/${file}`,
        exists: fs.existsSync(path.join(uploadsPath, file))
      }))
    });
  } catch (error) {
    console.error('Error reading uploads directory:', error);
    res.status(500).json({ 
      error: 'Failed to read uploads directory',
      details: error.message,
      uploadsPath
    });
  }
});

// Error handling middleware for file uploads
const multer = require('multer');
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    return res.status(400).json({
      error: 'File upload error',
      message: err.message
    });
  } else if (err) {
    // An unknown error occurred
    return res.status(500).json({
      error: 'Server error',
      message: err.message
    });
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// API Routes
app.use('/api/products', productRoutes);

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 'error', 
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});
