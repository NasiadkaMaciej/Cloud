const User = require('../models/user');
const keycloakService = require('../services/keycloak');
const { getUserStorageUsed } = require('../services/quota');

// Authentication middleware
const authenticate = async (req, res, next) => {
	try {
		// Skip auth for OPTIONS requests
		if (req.method === 'OPTIONS') return next();

		// Check for token
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer '))
			return res.status(401).json({ message: 'No token provided' });

		const token = authHeader.split(' ')[1];

		// Verify token
		const verified = await keycloakService.verifyToken(token);

		// Create standardized user object
		req.user = {
			id: verified.sub,
			username: verified.preferred_username,
			email: verified.email,
			roles: verified.realm_access?.roles || []
		};

		// Check if we need to get additional user data from MongoDB
		const dbUser = await User.findById(verified.sub);
		if (dbUser) {
			req.user.storageQuota = dbUser.storageQuota;
			req.user.usedStorage = getUserStorageUsed(req.user.id);
		}

		next();
	} catch (error) {
		console.error('Authentication error:', error.message);
		return res.status(401).json({ message: 'Unauthorized', error: error.message });
	}
};

module.exports = { authenticate };