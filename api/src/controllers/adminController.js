const User = require('../models/user');
const keycloakService = require('../services/keycloak');
const { getUserStorageUsed } = require('../services/quota');
const { cleanupAll } = require('../utils/adminCleanup');
const userService = require('../services/userService');

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
		const { id } = req.params;

		// Get user data from our system
		const userData = await userService.getUserData(id);

		res.status(200).json({
			userId: id,
			storageQuota: userData.storageQuota,
			usedStorage: userData.usedStorage,
			available: userData.available
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

		// Use the centralized user creation service
		const user = await userService.createUser(userId, { storageQuota: quotaInBytes });

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
		const result = await userService.deleteUser(userId);

		res.status(200).json({
			message: 'Account deleted successfully',
			details: result
		});
	} catch (error) {
		console.error('Error deleting account:', error);
		res.status(500).json({
			message: 'Error deleting account',
			error: error.message
		});
	}
};

exports.cleanupSystem = async (req, res) => {
	try {
		const results = await cleanupAll();

		res.status(200).json({
			message: 'Cleanup completed successfully',
			orphanedDbEntriesRemoved: results.dbEntriesRemoved,
			orphanedFilesRemoved: results.filesRemoved
		});
	} catch (error) {
		console.error('Error during system cleanup:', error);
		res.status(500).json({
			message: 'Error during system cleanup',
			error: error.message
		});
	}
};