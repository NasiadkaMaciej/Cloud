const userService = require('../services/userService');

// Get current user information
exports.getCurrentUser = async (req, res) => {
	try {
		const { id, username, email, roles } = req.user;

		// Get complete user data
		const userData = await userService.getUserData(id);

		res.status(200).json({
			id,
			username,
			email,
			roles,
			storageQuota: userData.storageQuota,
			usedStorage: userData.usedStorage,
			available: userData.available
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