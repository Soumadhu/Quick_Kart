const Rider = require('../models/Rider');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// Get JWT secret from environment with fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

// Log environment status
console.log('JWT Environment Status:', {
  hasJwtSecret: true, // Always true now due to fallback
  nodeEnv: process.env.NODE_ENV || 'development',
  usingFallback: !process.env.JWT_SECRET
});

// Get all riders
exports.getAllRiders = async (req, res) => {
  try {
    const riders = await Rider.query().select(
      'id',
      'name',
      'email',
      'phone',
      'vehicle_number',
      'is_active',
      'status',
      'created_at'
    );
    
    res.json(riders);
  } catch (error) {
    console.error('Error fetching riders:', error);
    res.status(500).json({ error: 'Failed to fetch riders' });
  }
};

// Login rider
exports.login = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { email, password } = req.body;

  try {
    // Find rider by email
    const rider = await Rider.query().findOne({ email });

    // Check if rider exists and password is correct
    if (!rider || !(await rider.verifyPassword(password))) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if rider is active
    if (!rider.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Update last login
    await Rider.query().findById(rider.id).patch({
      last_login: new Date().toISOString()
    });

    // Create JWT token
    const token = jwt.sign(
      { 
        id: rider.id, 
        email: rider.email,
        type: 'rider' 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Don't send password in response
    delete rider.password;

    res.json({
      success: true,
      token,
      id: rider.id,
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
      vehicle_number: rider.vehicle_number
    });
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      email: req.body.email,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'An error occurred during login. Please try again.'
    });
  }
};

// Register a new rider
exports.register = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { name, email, phone, password, vehicle_number } = req.body;

  // Additional validation
  if (!vehicle_number) {
    return res.status(400).json({
      error: 'Vehicle number is required'
    });
  }

  try {
    // Check if rider already exists with email or phone
    const existingRider = await Rider.query()
      .where('email', email)
      .orWhere('phone', phone)
      .first();

    if (existingRider) {
      return res.status(400).json({
        error: 'A rider with this email or phone already exists.'
      });
    }

    // Create new rider
    const rider = await Rider.query().insert({
      name,
      email,
      phone,
      password, // The model will hash this before saving
      vehicle_number,
      is_active: true,
      status: 'offline'
    });

    // Don't send password in response
    delete rider.password;

    res.status(201).json({
      message: 'Rider registered successfully',
      rider
    });
  } catch (error) {
    console.error('Error registering rider:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
      ...error
    });
    
    // Check for specific database errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.data || error.message,
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Check for duplicate entry error
    if (error.code === 'SQLITE_CONSTRAINT' || error.code === '23505' || error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        success: false,
        error: 'A rider with this email or phone already exists.',
        code: 'DUPLICATE_ENTRY'
      });
    }
    
    // Check for required field errors
    if (error.message && error.message.includes('NOT NULL constraint failed')) {
      const missingField = error.message.match(/NOT NULL constraint failed: [\w.]+\.(\w+)/);
      return res.status(400).json({
        success: false,
        error: `Missing required field: ${missingField ? missingField[1] : 'unknown'}`,
        code: 'MISSING_REQUIRED_FIELD'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'An error occurred while registering the rider.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Get rider profile
exports.getProfile = async (req, res) => {
  try {
    // The rider ID is set by the auth middleware
    const riderId = req.rider.id;
    
    // Find the rider by ID
    const rider = await Rider.query()
      .findById(riderId)
      .select(
        'id',
        'name',
        'email',
        'phone',
        'vehicle_number',
        'is_active',
        'status',
        'last_login',
        'created_at'
      )
      .first();

    if (!rider) {
      return res.status(404).json({
        success: false,
        error: 'Rider not found'
      });
    }

    res.json({
      success: true,
      rider
    });
  } catch (error) {
    console.error('Error fetching rider profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rider profile'
    });
  }
};

// Update rider profile
exports.updateProfile = async (req, res) => {
  console.log('Update profile request received:', {
    body: req.body,
    file: req.file,
    rider: req.rider
  });
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ 
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const riderId = req.rider.id;
  const updates = {};

  // Only include the fields that are present in the request
  if (req.body.name) updates.name = req.body.name;
  if (req.body.email) updates.email = req.body.email;
  if (req.body.phone) updates.phone = req.body.phone;
  if (req.body.vehicle_number) updates.vehicle_number = req.body.vehicle_number;
  if (req.body.vehicle_model) updates.vehicle_model = req.body.vehicle_model;
  if (req.body.vehicle) updates.vehicle_model = req.body.vehicle; // Handle both vehicle and vehicle_model
  
  // If no updates and no file, return success with current data
  if (Object.keys(updates).length === 0 && !req.file) {
    console.log('No updates provided, returning current profile data');
    const currentRider = await Rider.query().findById(riderId);
    if (!currentRider) {
      return res.status(404).json({
        success: false,
        error: 'Rider not found'
      });
    }
    
    // Remove sensitive data before sending the response
    const { password, reset_token, ...riderData } = currentRider;
    
    return res.json({
      success: true,
      message: 'No updates provided',
      rider: riderData
    });
  }

  try {
    // Handle file upload if present
    let profilePictureUrl = null;
    if (req.file) {
      // If there was a previous profile picture, delete it
      if (req.rider.profile_picture) {
        // Extract just the filename from the stored path
        const filename = req.rider.profile_picture.split('/').pop();
        const oldImagePath = path.join(__dirname, '../../../public/uploads/riders/', filename);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      // Save relative path in database (without 'public/' as it's served statically)
      updates.profile_picture = 'uploads/riders/' + req.file.filename;
      // Create full URL for the response
      profilePictureUrl = 'http://192.168.0.103:5000/uploads/riders/' + req.file.filename;
    }
    let updatedRider;
    
    try {
      console.log('Updating rider with ID:', riderId, 'Updates:', updates);
      
      // Only try to update if there are updates
      if (Object.keys(updates).length > 0) {
        updatedRider = await Rider.query()
          .patchAndFetchById(riderId, updates);
          
        console.log('Update result:', updatedRider);
        
        if (!updatedRider) {
          console.error('Rider not found with ID:', riderId);
          return res.status(404).json({
            success: false,
            error: 'Rider not found'
          });
        }
      } else {
        // If no updates but there's a file, just fetch the current rider
        updatedRider = await Rider.query().findById(riderId);
        if (!updatedRider) {
          return res.status(404).json({
            success: false,
            error: 'Rider not found'
          });
        }
      }

    } catch (error) {
      console.error('Database update error:', error);
      throw error;
    }

    // Remove sensitive data before sending the response
    const { password, reset_token, ...riderData } = updatedRider;

    // Handle profile picture URL in response
    if (riderData.profile_picture) {
      if (profilePictureUrl) {
        // Use the newly generated URL
        riderData.profile_picture = profilePictureUrl;
      } else if (!riderData.profile_picture.startsWith('http')) {
        // Convert relative path to full URL
        riderData.profile_picture = 'http://192.168.0.103:5000/' + 
          (riderData.profile_picture.startsWith('uploads/') ? '' : 'uploads/riders/') + 
          riderData.profile_picture.split('/').pop();
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      rider: riderData
    });

  } catch (error) {
    console.error('Error updating rider profile:', error);
    
    // Handle duplicate email error
    if (error.code === '23505' && error.constraint === 'riders_email_unique') {
      return res.status(400).json({
        success: false,
        error: 'Email is already in use'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
