const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { testConnection } = require('../config/db');

// Import routes
const productRoutes = require('./routes/api/products');
const createCategoryRoutes = require('./routes/api/categories');

// Initialize express app
const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:8081', // React Native web
  'http://localhost:19006', // Expo web
  'exp://192.168.0.*:*', // Expo on device
  'http://localhost:3000', // Local development
  'http://192.168.0.102:5000', // Server address
  'http://192.168.0.102:19006' // Expo dev client
];

// Enable CORS pre-flight
app.options('*', cors());

// Apply CORS with dynamic origin
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (!origin || allowedOrigins.some(allowedOrigin => 
    origin === allowedOrigin || 
    (allowedOrigin.includes('*') && new RegExp(allowedOrigin.replace(/\*/g, '.*')).test(origin))
  )) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Ensure public directory exists
const publicPath = path.join(__dirname, '../../../server/public');
if (!fs.existsSync(publicPath)) {
  fs.mkdirSync(publicPath, { recursive: true });
  console.log('Created public directory at:', publicPath);
}

// Ensure uploads directory exists
const uploadsPath = path.join(publicPath, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('Created uploads directory at:', uploadsPath);
}

// Serve static files from public directory
app.use(express.static(publicPath));

// Serve uploads directory with cache control
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res) => {
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  }
}));

console.log('Serving static files from:', publicPath);
console.log('Serving uploads from:', uploadsPath);

// API Routes - Initialize database and create routes
const initializeRoutes = async () => {
  try {
    const db = require('../config/db');
    
    // Initialize product routes with database
    app.use('/api/products', productRoutes);
    
    // Initialize category routes with database
    const categoryRoutes = createCategoryRoutes(db);
    app.use('/api/categories', categoryRoutes);
    
    console.log('API routes initialized successfully');
  } catch (error) {
    console.error('Error initializing API routes:', error);
  }
};

// Initialize routes after database connection
testConnection()
  .then(() => {
    console.log('Database connection established successfully');
    return initializeRoutes();
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  });

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

module.exports = app;
