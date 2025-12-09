const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

module.exports = (req, res, next) => {
  // Get token from header
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      message: 'No authorization token provided',
      code: 'AUTH_TOKEN_MISSING'
    });
  }

  // Check for Bearer token
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7, authHeader.length) 
    : null;

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid token format. Use: Bearer <token>',
      code: 'INVALID_TOKEN_FORMAT'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET || 'your_jwt_secret');
    
    // Handle both { user } and direct payload structures
    req.user = decoded.user || decoded;
    
    // Add user info to response headers for debugging
    res.set('X-Authenticated-User', JSON.stringify({
      id: req.user.id,
      role: req.user.role || 'user'
    }));
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
