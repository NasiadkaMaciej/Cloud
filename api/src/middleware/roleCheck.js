const roleCheck = (requiredRoles = []) => {
	return (req, res, next) => {
		try {
			// req.user should be set by the authenticate middleware
			if (!req.user || !req.user.roles) {
				return res.status(403).json({
					message: 'Forbidden: User role information missing'
				});
			}

			// Check if the user has at least one of the required roles
			const userHasRequiredRole = requiredRoles.some(role => req.user.roles.includes(role));

			if (!userHasRequiredRole) return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });

			next();
		} catch (error) {
			console.error('Role check error:', error);
			res.status(500).json({ message: 'Server error during role validation' });
		}
	};
};

module.exports = roleCheck;