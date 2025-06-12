const User = require('../models/user');
const File = require('../models/file');
const keycloakService = require('../services/keycloak');
const { getUserStorageUsed } = require('../services/quota');

// Get all users with their quotas
exports.getUsers = async (req, res) => {
	try {
		// Get users from Keycloak
		const keycloakUsers = await keycloakService.getKeycloakUsers();

		// Get quota info from our database
		const users = await Promise.all(keycloakUsers.map(async (user) => {
			const userData = await keycloakService.transformUser(user);

			// Try to find user in our database for quota information
			const localUser = await User.findById(user.id);
			const storageQuota = localUser?.storageQuota || (5 * 1024 * 1024 * 1024); // Default 5GB
			const usedStorage = getUserStorageUsed(user.id);

			return {
				...userData,
				storageQuota,
				usedStorage
			};
		}));

		res.status(200).json(users);
	} catch (error) {
		console.error('Error retrieving users:', error);
		res.status(500).json({
			message: 'Error retrieving users',
			error: error.message
		});
	}
};

// Get user quota information
exports.getUserQuota = async (req, res) => {
	try {
		const userId = req.params.id;

		// Find the user in the database
		const user = await User.findById(userId);

		if (!user) return res.status(404).json({ message: 'User not found' });

		const usedStorage = getUserStorageUsed(userId);

		// Return the quota information
		return res.status(200).json({
			userId: user._id,
			storageQuota: user.storageQuota,
			usedStorage: usedStorage,
			available: user.storageQuota - usedStorage
		});
	} catch (error) {
		console.error('Error retrieving user quota:', error);
		res.status(500).json({
			message: 'Error retrieving user quota',
			error: error.message
		});
	}
};

// Update user quota
exports.updateUserQuota = async (req, res) => {
	const userId = req.params.id;
	const { quota } = req.body;

	try {
		const quotaInBytes = Number(quota) * 1024 * 1024 * 1024;

		// First check if user exists
		let user = await User.findById(userId);

		if (!user) {
			// Create new user document with required fields
			user = new User({
				_id: userId,
				storageQuota: quotaInBytes,
				usedStorage: 0
			});
			await user.save();
		} else {
			// Update existing user
			user.storageQuota = quotaInBytes;
			await user.save();
		}

		res.status(200).json(quotaInBytes);
	} catch (error) {
		console.error('Error updating quota:', error);
		res.status(500).json({
			message: 'Error updating user quota',
			error: error.message
		});
	}
};

// Remove user
exports.removeUser = async (req, res) => {
	try {
		const userId = req.params.id;
		const fs = require('fs').promises;
		const { getUserDir } = require('../utils/fileSystem');

		// First try to delete from Keycloak
		const keycloakResult = await keycloakService.deleteUser(userId);

		// Get user directory
		const userDir = getUserDir(userId);

		let folderDeleted = false;
		// Delete user's folder with all contents
		try {
			await fs.rm(userDir, { recursive: true, force: true });
			console.log(`Successfully removed user directory: ${userDir}`);
			folderDeleted = true;
		} catch (fsError) {
			console.error(`Error removing user directory: ${fsError.message}`);
		}

		// Delete file records from database
		await File.deleteMany({ userId });

		// Then delete from MongoDB
		const mongoResult = await User.findByIdAndDelete(userId);

		if (!keycloakResult && !mongoResult)
			return res.status(404).json({ message: 'User not found in either system' });

		res.status(200).json({
			message: 'User deleted successfully',
			keycloakDeleted: !!keycloakResult,
			mongoDeleted: !!mongoResult,
			folderDeleted
		});
	} catch (error) {
		console.error('Error removing user:', error);
		res.status(500).json({
			message: 'Error removing user',
			error: error.message
		});
	}
};