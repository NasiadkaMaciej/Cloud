const fs = require('fs');
const path = require('path');

// Base directory for all user files
const baseStorageDir = path.join(__dirname, '../../uploads/users');

// Ensure the base directory exists
if (!fs.existsSync(baseStorageDir)) {
	fs.mkdirSync(baseStorageDir, { recursive: true });
}

// Get or create a user-specific directory
const getUserDir = (userId) => {
	if (!userId) throw new Error('User ID is required');

	// Sanitize userId for filesystem use
	const sanitizedUserId = userId.toString().replace(/[^a-zA-Z0-9-]/g, '_');
	const userDir = path.join(baseStorageDir, sanitizedUserId);

	// Create user directory if needed
	if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

	return userDir;
};

// Calculate total size of all files in a directory
const calculateDirectorySize = (directoryPath) => {
	if (!fs.existsSync(directoryPath)) return 0;

	return fs.readdirSync(directoryPath)
		.map(file => {
			const filePath = path.join(directoryPath, file);
			try {
				const stats = fs.statSync(filePath);
				return stats.isFile() ? stats.size : 0;
			} catch (error) {
				return 0;
			}
		})
		.reduce((total, size) => total + size, 0);
};

module.exports = {
	getUserDir,
	baseStorageDir,
	calculateDirectorySize
};