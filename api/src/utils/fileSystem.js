const fs = require('fs');
const path = require('path');

// Base directory for all user files
const baseStorageDir = path.join(__dirname, '../../uploads/users');

// Ensure the base directory exists
if (!fs.existsSync(baseStorageDir)) {
	console.log('Creating base storage directory:', baseStorageDir);
	fs.mkdirSync(baseStorageDir, { recursive: true });
}

// Get or create a user-specific directory
const getUserDir = (userId) => {
	if (!userId)
		throw new Error('User ID is required to get user directory');

	// Ensure userId is treated as a string and sanitized
	const sanitizedUserId = userId.toString().replace(/[^a-zA-Z0-9-]/g, '_');
	const userDir = path.join(baseStorageDir, sanitizedUserId);

	// Create user directory if it doesn't exist
	if (!fs.existsSync(userDir)) {
		console.log('Creating user directory:', userDir);
		fs.mkdirSync(userDir, { recursive: true });
	}

	return userDir;
};

// Calculate total size of all files in a directory
const calculateDirectorySize = (directoryPath) => {
	if (!fs.existsSync(directoryPath)) {
		return 0;
	}

	let totalSize = 0;
	const files = fs.readdirSync(directoryPath);

	files.forEach(file => {
		const filePath = path.join(directoryPath, file);
		try {
			const stats = fs.statSync(filePath);
			if (stats.isFile()) totalSize += stats.size;
		} catch (error) {
			console.error(`Error calculating size for ${filePath}:`, error);
		}
	});

	return totalSize;
};

module.exports = {
	getUserDir,
	baseStorageDir,
	calculateDirectorySize
};