const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get current user info
router.get('/me', userController.getCurrentUser);

// Delete current user's account
router.delete('/me', userController.deleteAccount);

module.exports = router;