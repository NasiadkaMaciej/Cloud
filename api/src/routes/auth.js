const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Middleware to protect routes
router.use(authenticate);

module.exports = router;