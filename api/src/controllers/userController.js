const User = require('../models/user');
const { getUserStorageUsed } = require('../services/quota');
const File = require('../models/file');
const fs = require('fs');
const { getUserDir } = require('../utils/fileSystem');
const keycloakService = require('../services/keycloak');

// Get current user information
exports.getCurrentUser = async (req, res) => {
	try {
		// User data is already available from auth middleware
		const { id, username, email, roles } = req.user;

		// Get storage usage information
		const usedStorage = getUserStorageUsed(id);

		// Find or create user in our database to get storage quota
		let user = await User.findById(id);
		if (!user) {
			// Create new user with default quota
			user = new User({
				_id: id,
				storageQuota: 5 * 1024 * 1024 * 1024 // Default 5GB
			});
			await user.save();
		}

		res.status(200).json({
			id,
			username,
			email,
			roles,
			storageQuota: user.storageQuota,
			usedStorage,
			available: user.storageQuota - usedStorage
		});
	} catch (error) {
		console.error('Error getting user data:', error);
		res.status(500).json({
			message: 'Error retrieving user data',
			error: error.message
		});
	}
};

// Delete current user's account
exports.deleteAccount = async (req, res) => {
	try {
		const userId = req.user.id;

		// Delete user's folder with all contents
		const userDir = getUserDir(userId);
		let folderDeleted = false;

		try {
			await fs.promises.rm(userDir, { recursive: true, force: true });
			console.log(`Successfully removed user directory: ${userDir}`);
			folderDeleted = true;
		} catch (fsError) {
			console.error(`Error removing user directory: ${fsError.message}`);
		}

		// Delete file records from database
		await File.deleteMany({ userId });

		// Delete user from MongoDB
		const mongoResult = await User.findByIdAndDelete(userId);

		const keycloakResult = await keycloakService.deleteUser(userId);


		res.status(200).json({
			message: 'Account deleted successfully',
			mongoDeleted: !!mongoResult,
			keycloakDeleted: !!keycloakResult,
			folderDeleted
		});
	} catch (error) {
		console.error('Error deleting account:', error);
		res.status(500).json({
			message: 'Error deleting account',
			error: error.message
		});
	}
};