const jwt = require('jsonwebtoken');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { JWT_SECRET } = process.env;
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

const { body, validationResult } = require('express-validator');

exports.register = [
  // Input validation
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),

  // Process request after validation
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: errors.array() 
        });
      }

      const { email, password, firstName, lastName, phone } = req.body;

      // Check if user already exists (case-insensitive)
      const existingUser = await db('users')
        .whereRaw('LOWER(email) = ?', [email.toLowerCase()])
        .first();
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Email already registered',
          field: 'email'
        });
      }

      // Create new user
      const user = await User.create({
        email: email.toLowerCase(),
        password,
        firstName,
        lastName,
        phone,
        role: 'customer'
      });

      // Generate JWT token
      const token = generateToken(user);

      // Log successful registration (in production, use a proper logger)
      console.log(`New user registered: ${email}`);

      // Return user data and token
      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error registering user',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
];

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email using Knex (case-insensitive)
    const user = await db('users')
      .whereRaw('LOWER(email) = ?', [email.toLowerCase()])
      .first();
      
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return user data and token
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};
