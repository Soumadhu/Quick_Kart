const jwt = require('jsonwebtoken');
const { JWT_SECRET, ADMIN_SECRET_KEY } = process.env;

// Middleware to verify admin secret key
exports.verifyAdminKey = (req, res, next) => {
  const { adminKey } = req.body;
  
  if (!adminKey || adminKey !== ADMIN_SECRET_KEY) {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid or missing admin secret key' 
    });
  }
  next();
};

// Middleware to verify admin JWT token
exports.authenticateAdmin = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'No token, authorization denied' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is an admin
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admins only.' 
      });
    }
    
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ 
      success: false,
      message: 'Token is not valid' 
    });
  }
};
