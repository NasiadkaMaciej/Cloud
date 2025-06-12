const File = require('../models/file');
const fs = require('fs').promises;
const path = require('path');
const { baseStorageDir } = require('./fileSystem');


// Clean up orphaned files (files in DB with no matching file on disk)
const cleanupOrphanedDbEntries = async () => {
	const files = await File.find({});
	let removedCount = 0;

	for (const file of files) {
		const userId = file.userId;
		const userDir = path.join(baseStorageDir, userId.toString());
		const filePath = path.join(userDir, file.fileName);

		try {
			await fs.access(filePath);
		} catch (error) {
			// File doesn't exist, remove from DB
			await File.deleteOne({ _id: file._id });
			removedCount++;
			console.log(`Removed orphaned DB entry: ${file._id} (${file.fileName})`);
		}
	}

	return removedCount;
};

// Clean up orphaned files (files on disk with no matching entry in DB)
const cleanupOrphanedFiles = async () => {
	// Get all user directories
	const userDirs = await fs.readdir(baseStorageDir);
	let removedCount = 0;

	for (const userId of userDirs) {
		const userDir = path.join(baseStorageDir, userId);

		// Skip if not a directory
		try {
			const stats = await fs.stat(userDir);
			if (!stats.isDirectory()) continue;
		} catch (error) {
			continue;
		}

		// Get all files in user directory
		const files = await fs.readdir(userDir);

		for (const fileName of files) {
			const filePath = path.join(userDir, fileName);

			// Skip if not a file
			try {
				const stats = await fs.stat(filePath);
				if (!stats.isFile()) continue;
			} catch (error) {
				continue;
			}

			// Check if file exists in DB
			const fileInDb = await File.findOne({ userId, fileName });

			if (!fileInDb) {
				// File not in DB, remove it
				await fs.unlink(filePath);
				removedCount++;
				console.log(`Removed orphaned file: ${filePath}`);
			}
		}
	}

	return removedCount;
};

// Add a route to the admin controller to trigger these cleanup functions
const cleanupAll = async () => {
	const dbEntriesRemoved = await cleanupOrphanedDbEntries();
	const filesRemoved = await cleanupOrphanedFiles();

	return {
		dbEntriesRemoved,
		filesRemoved
	};
};

module.exports = {
	cleanupOrphanedDbEntries,
	cleanupOrphanedFiles,
	cleanupAll
};