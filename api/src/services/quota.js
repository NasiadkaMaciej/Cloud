const User = require('../models/user');
const { getUserDir, calculateDirectorySize } = require('../utils/fileSystem');

const QUOTA_LIMIT = 5 * 1024 * 1024 * 1024; // 5 GB in bytes

const getUserStorageUsed = (userId) => {
	try {
		const userDir = getUserDir(userId);
		return calculateDirectorySize(userDir);
	} catch (error) {
		console.error('Error calculating user storage:', error);
		return 0; // Default to 0 if there's an error
	}
};

const checkUserQuota = async (userId, fileSize = 0) => {
	try {
		// Get the user's quota
		let user = await User.findById(userId).exec();
		const quota = user ? user.storageQuota : QUOTA_LIMIT;

		// Calculate current usage from filesystem
		const usedStorage = getUserStorageUsed(userId);

		return {
			quota,
			usedStorage,
			available: quota - usedStorage,
			hasAvailableSpace: (usedStorage + fileSize) <= quota
		};
	} catch (error) {
		console.error('Error checking quota:', error);
		// Default values in case of error
		return {
			quota: QUOTA_LIMIT,
			usedStorage: 0,
			available: QUOTA_LIMIT,
			hasAvailableSpace: true
		};
	}
};

module.exports = {
	checkUserQuota,
	getUserStorageUsed
};