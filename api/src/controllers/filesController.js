const File = require('../models/file');
const fs = require('fs');
const path = require('path');
const { getUserDir } = require('../utils/fileSystem');
const quotaService = require('../services/quota');

// Download a file
exports.downloadFile = async (req, res) => {
	try {
		const { fileId } = req.params;
		const userId = req.user.id;

		// Find the file document in the database
		const file = await File.findOne({ _id: fileId, userId });
		if (!file) return res.status(404).json({ message: 'File not found in database' });

		// Get the user's directory
		const userDir = getUserDir(userId);

		// Use original filename for the file path
		const filePath = path.join(userDir, file.fileName);

		if (!fs.existsSync(filePath)) {
			return res.status(404).json({ message: 'File content not found on disk' });
		}

		res.download(filePath, file.fileName);
	} catch (error) {
		console.error('Error downloading file:', error);
		res.status(500).json({
			message: 'Error downloading file',
			error: error.message,
			stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
		});
	}
};

// Upload a file
exports.uploadFile = async (req, res) => {
	try {
		const userId = req.user.id;
		const { file } = req;

		if (!file) return res.status(400).json({ message: 'No file uploaded' });

		// Check quota before saving file metadata
		const quotaInfo = await quotaService.checkUserQuota(userId, file.size);

		if (!quotaInfo.hasAvailableSpace) {
			// Remove temporary file
			fs.unlinkSync(file.path);
			return res.status(403).json({ message: 'Storage quota exceeded' });
		}

		// Check if a file with the same name already exists in the database for this user
		const existingFile = await File.findOne({ userId, fileName: file.originalname });

		if (existingFile) {
			// Update existing file record
			existingFile.fileSize = file.size;
			existingFile.updatedAt = Date.now();
			await existingFile.save();

			res.status(200).json({
				_id: existingFile._id,
				fileName: existingFile.fileName,
				fileSize: existingFile.fileSize,
				createdAt: existingFile.createdAt,
				updatedAt: existingFile.updatedAt
			});
		} else {
			// Create new file record in database
			const newFile = new File({
				userId,
				fileName: file.originalname,
				fileSize: file.size,
			});

			await newFile.save();

			res.status(201).json({
				_id: newFile._id,
				fileName: newFile.fileName,
				fileSize: newFile.fileSize,
				createdAt: newFile.createdAt
			});
		}
	} catch (error) {
		console.error('Error uploading file:', error);
		res.status(500).json({
			message: 'Error uploading file',
			error: error.message
		});
	}
};

// Get user's files
exports.getFiles = async (req, res) => {
	try {
		const userId = req.user.id;

		if (!userId) return res.status(400).json({ message: 'User ID is required' });

		const files = await File.find({ userId });
		res.status(200).json(files);
	} catch (error) {
		console.error('Error retrieving files:', error);
		res.status(500).json({
			message: 'Error retrieving files',
			error: error.message,
		});
	}
};

// Delete a file
exports.deleteFile = async (req, res) => {
	try {
		const { fileId } = req.params;
		const userId = req.user.id;

		// Find the file record
		const file = await File.findOne({ _id: fileId, userId });
		if (!file) return res.status(404).json({ message: 'File not found' });

		// Delete file
		const userDir = getUserDir(userId);
		const filePath = path.join(userDir, file.fileName);

		if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
		else console.warn(`File not found at ${filePath}`);

		// Delete database record
		await File.deleteOne({ _id: fileId, userId });

		return res.status(200).json({ message: 'File deleted successfully' });
	} catch (error) {
		res.status(500).json({ message: 'Error deleting file', error: error.message });
	}
};