const express = require('express');
const router = express.Router();
const riderController = require('../controllers/riderController');
const { riderValidationRules, loginValidationRules } = require('../validators/riderValidator');
const validate = require('../middleware/validate');
const riderAuth = require('../middleware/riderAuth');
const upload = require('../config/multer');

// Public routes
router.post('/register', riderValidationRules(), validate, riderController.register);
router.post('/login', loginValidationRules(), validate, riderController.login);

// Protected routes (require authentication)
router.use(riderAuth);

// Get all riders (admin only)
router.get('/', riderController.getAllRiders);

// Get and update rider profile
router.route('/profile')
  .get(riderController.getProfile)
  .put(upload.single('profile_picture'), riderController.updateProfile);

module.exports = router;
