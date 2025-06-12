module.exports = (requiredRoles) => {
	return (req, res, next) => {
		// Skip role check for OPTIONS requests
		if (req.method === 'OPTIONS') return next();

		// Check if user exists
		if (!req.user) return res.status(403).json({ message: 'Access denied. User not authenticated.' });

		// Ensure we have an array of roles to check
		const userRoles = req.user.roles || [];

		// Check if user has any of the required roles
		const hasRole = userRoles.some(role => requiredRoles.includes(role));
		if (!hasRole) return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });

		next();
	};
};