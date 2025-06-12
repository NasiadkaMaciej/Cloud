const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Middleware to check if user is authenticated and has admin role
router.use(authenticate);
router.use(roleCheck(['admin']));

// Route to get all users
router.get('/users', adminController.getUsers);

// Route to delete a user
router.delete('/users/:id', adminController.removeUser);

// Route to get user quota
router.get('/users/:id/quota', adminController.getUserQuota);

// Route to adjust user quota
router.post('/users/:id/quota', adminController.updateUserQuota);

// Route to perform system cleanup
router.post('/system/cleanup', adminController.cleanupSystem);

module.exports = router;