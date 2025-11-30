const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

const riderAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if token is for a rider
    if (decoded.type !== 'rider') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Rider privileges required.'
      });
    }

    // Add user to request object
    req.rider = {
      id: decoded.id,
      email: decoded.email,
      type: decoded.type
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. Please log in again.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please log in again.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Authentication failed. Please try again.'
    });
  }
};

module.exports = riderAuth;
