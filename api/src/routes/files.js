const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { downloadFile, uploadFile, getFiles, deleteFile } = require('../controllers/filesController');
const { authenticate } = require('../middleware/auth');
const { getUserDir } = require('../utils/fileSystem');

const router = express.Router();

// Configure storage for file uploads
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		try {
			// Store in user-specific directory
			const userDir = getUserDir(req.user.id);
			console.log('Storing file in directory:', userDir);
			cb(null, userDir);
		} catch (error) {
			console.error('Error setting upload destination:', error);
			cb(error);
		}
	},
	filename: function (req, file, cb) {
		try {
			// Always use original filename - if file exists, it will be overwritten
			cb(null, file.originalname);
		} catch (error) {
			console.error('Error generating filename:', error);
			cb(error);
		}
	}
});

const upload = multer({
	storage: storage,
	limits: {
		fileSize: 1 * 1024 * 1024 * 1024, // 1GB limit
	}
});

// Routes
router.get('/:fileId/download', authenticate, downloadFile);
router.post('/upload', authenticate, upload.single('file'), uploadFile);
router.get('/', authenticate, getFiles);
router.delete('/:fileId', authenticate, deleteFile);

module.exports = router;