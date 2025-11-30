require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const createCategoryRoutes = require('./routes/api/categories');
const riderRoutes = require('./routes/riderRoutes');
const { default: ip } = require('ip');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
const publicPath = path.join(__dirname, '..', 'public');
const uploadsPath = path.join(publicPath, 'uploads');

// Create directories if they don't exist
if (!fs.existsSync(publicPath)) fs.mkdirSync(publicPath, { recursive: true });
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });

console.log('Serving static files from:', publicPath);
console.log('Uploads directory:', uploadsPath);

// Serve static files
app.use(express.static(publicPath));
app.use('/uploads', express.static(uploadsPath));

// Test route
app.get('/api', (req, res) => {
  res.json({ message: 'API is working' });
});

// Initialize database and setup routes
const setupRoutes = async () => {
  try {
    // Test database connection
    await db.raw('SELECT 1');
    console.log('Database connection successful');
    
    // Initialize API routes with database connection
    const apiRouter = express.Router();
    
    // Mount routes
    apiRouter.use('/products', productRoutes);
    
    // Mount category routes with database connection
    const categoryRoutes = createCategoryRoutes(db);
    apiRouter.use('/categories', categoryRoutes);
    
    // Mount rider routes
    apiRouter.use('/riders', riderRoutes);
    
    // Mount the API router
    app.use('/api', apiRouter);
    
    // 404 handler for API routes
    app.use('/api/*', (req, res) => {
      res.status(404).json({ error: 'API endpoint not found' });
    });
    
    console.log('API routes initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize routes:', error);
    throw error;
  }
};

// Start the server
const startServer = async () => {
  try {
    await setupRoutes();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n=== Server Started ===`);
      console.log(`Local:    http://localhost:${PORT}`);
      
      // Safely get network IP address
      let networkUrl = 'N/A';
      try {
        networkUrl = `http://${ip.address()}:${PORT}`;
      } catch (error) {
        console.warn('Could not determine network IP address');
      }
      
      console.log(`Network:  ${networkUrl}`);
      console.log(`API Base: http://localhost:${PORT}/api`);
      console.log(`Database: ${process.env.DB_CLIENT || 'sqlite3'} (./data/quickkart.sqlite3)`);
      console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
      console.log(`========================\n`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer().catch(err => {
  console.error('Fatal error during server startup:', err);
  process.exit(1);
});

// Error handling
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 'error', 
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// List files in uploads directory
app.get('/list-uploads', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsPath);
    res.json({
      uploadsPath,
      files: files.map(file => ({
        name: file,
        path: path.join(uploadsPath, file),
        url: `/uploads/${file}`,
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
  }
  next(err);
});
