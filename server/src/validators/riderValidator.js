const { body, oneOf } = require('express-validator');

const riderValidationRules = () => {
  return [
    // Name validation
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),
    
    // Email validation
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail()
      .isLength({ max: 255 }).withMessage('Email must be less than 255 characters'),
    
    // Phone validation
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required')
      .isMobilePhone('any').withMessage('Please provide a valid phone number')
      .isLength({ min: 10, max: 15 }).withMessage('Phone number must be between 10 and 15 digits'),
    
    // Password validation
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    
    // Vehicle number validation
    body('vehicle_number')
      .trim()
      .notEmpty().withMessage('Vehicle number is required')
      .isLength({ min: 5, max: 20 }).withMessage('Vehicle number must be between 5 and 20 characters')
  ];
};

// Validation rules for rider login
const loginValidationRules = () => {
  return [
    // Email validation
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .normalizeEmail(),
    
    // Password validation
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ];
};

module.exports = {
  riderValidationRules,
  loginValidationRules
};
