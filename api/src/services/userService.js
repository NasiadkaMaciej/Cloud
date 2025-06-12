const User = require('../models/user');
const File = require('../models/file');
const keycloakService = require('./keycloak');
const { getUserDir } = require('../utils/fileSystem');
const { getUserStorageUsed } = require('./quota');
const fs = require('fs').promises;

// Create or update a user with specified settings
const createUser = async (userId, options = {}) => {
	if (!userId) throw new Error('User ID is required');

	const storageQuota = options.storageQuota || (5 * 1024 * 1024 * 1024); // Default 5GB

	// Find or create user
	let user = await User.findById(userId);

	if (!user) {
		// Create new user
		user = new User({
			_id: userId,
			storageQuota
		});
	} else if (options.storageQuota) {
		// Update quota if provided
		user.storageQuota = storageQuota;
	}

	await user.save();
	return user;
};

//Get fully populated user data by ID
const getUserData = async (userId) => {
	// Find or create user in our database
	let user = await createUser(userId);

	const usedStorage = getUserStorageUsed(userId);

	return {
		...user.toObject(),
		usedStorage,
		available: user.storageQuota - usedStorage
	};
};

// Deletes a user completely from the system
const deleteUser = async (userId) => {
	// Delete user's folder with all contents
	const userDir = getUserDir(userId);
	let folderDeleted = false;

	try {
		await fs.rm(userDir, { recursive: true, force: true });
		folderDeleted = true;
	} catch (fsError) {
		console.error(`Error removing user directory: ${fsError.message}`);
	}

	// Delete file records from database
	await File.deleteMany({ userId });

	// Delete from MongoDB
	const mongoResult = await User.findByIdAndDelete(userId);

	// Delete from Keycloak
	const keycloakResult = await keycloakService.deleteUser(userId);

	return {
		mongoDeleted: !!mongoResult,
		keycloakDeleted: !!keycloakResult,
		folderDeleted
	};
};

module.exports = {
	createUser,
	getUserData,
	deleteUser
};