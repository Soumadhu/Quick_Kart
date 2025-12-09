const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { testConnection } = require('../config/db');

// Import routes
const productRoutes = require('./routes/api/products');
const createCategoryRoutes = require('./routes/api/categories');
const riderRoutes = require('./routes/riderRoutes');
const orderRoutes = require('./routes/api/orders');

// Initialize express app
const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:8081', // React Native web
  'http://localhost:19006', // Expo web
  'exp://192.168.0.*:*', // Expo on device
  'http://localhost:3000', // Local development
  'http://192.168.0.100:5000', // Server address
  'http://192.168.0.100:19006', // Expo dev client
  'http://192.168.0.102:5000', // Server address
  'http://192.168.0.102:19006', // Expo dev client
  'http://192.168.0.103:5000', // Server IP
  'http://192.168.0.103:19006', // Expo dev client on server IP
  'http://localhost:5000', // Local server
  'http://127.0.0.1:5000', // Localhost alternative
  'http://localhost:19006', // Expo web alternative
  'http://127.0.0.1:19006', // Expo web alternative
  'http://192.168.0.100:8081' // React Native web on local network
];

// Function to check if origin is allowed
const isOriginAllowed = (origin) => {
  if (!origin) return false;
  
  return allowedOrigins.some(allowedOrigin => {
    // Handle wildcard patterns like 'exp://192.168.0.*:*'
    if (allowedOrigin.includes('*')) {
      const regex = new RegExp('^' + allowedOrigin.replace(/\./g, '\\.').replace(/\*/g, '.*'));
      return regex.test(origin);
    }
    return allowedOrigin === origin;
  });
};

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, false);
    
    if (isOriginAllowed(origin)) {
      // For credentialed requests, we must return the exact origin, not true
      callback(null, origin);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cache-Control',
    'X-Requested-With',
    'Accept',
    'X-Access-Token',
    'X-Refresh-Token',
    'Pragma',
    'Accept-Language',
    'Accept-Encoding',
    'Connection',
    'Host',
    'Origin',
    'Referer',
    'User-Agent'
  ],
  exposedHeaders: [
    'Content-Length',
    'X-Access-Token',
    'X-Refresh-Token'
  ],
  credentials: true,  // Important for cookies, authorization headers
  maxAge: 86400,      // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Add CORS headers to all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers for all responses
  if (origin && isOriginAllowed(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, X-Requested-With, Accept, X-Access-Token, X-Refresh-Token');
  res.header('Access-Control-Expose-Headers', 'X-Access-Token, X-Refresh-Token');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

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
    
    // Initialize rider routes
    app.use('/api/riders', riderRoutes);
    
    // Initialize order routes
    app.use('/api/orders', orderRoutes);
    
    console.log('API routes initialized successfully');
  } catch (error) {
    console.error('Error initializing API routes:', error);
  }
};

// Initialize routes after database connection
testConnection()
  .then(() => {
    console.log('Database connection established successfully');
    // Initialize routes after successful database connection
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
