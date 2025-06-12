const axios = require('axios');
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const { promisify } = require('util');

// Centralized configuration
const config = {
	url: process.env.KEYCLOAK_URL || 'http://localhost:8080',
	realm: process.env.KEYCLOAK_REALM || 'personal-cloud',
	clientId: process.env.KEYCLOAK_CLIENT_ID || 'secure-cloud-api',
	adminUser: process.env.KEYCLOAK_ADMIN || 'admin',
	adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin'
};

// Initialize JWKS client once
const jwksClient = jwksRsa({
	jwksUri: `${config.url}/realms/${config.realm}/protocol/openid-connect/certs`
});

// Get signing key (for token verification)
const getSigningKey = async (kid) => {
	return new Promise((resolve, reject) => {
		jwksClient.getSigningKey(kid, (err, key) => {
			if (err) return reject(err);
			const signingKey = key.publicKey || key.rsaPublicKey;
			resolve(signingKey);
		});
	});
};

// Verify token with proper error handling
const verifyToken = async (token) => {
	try {
		const decodedToken = jwt.decode(token, { complete: true });
		if (!decodedToken) {
			throw new Error('Invalid token format');
		}

		const signingKey = await getSigningKey(decodedToken.header.kid);
		const verifyAsync = promisify(jwt.verify);

		return await verifyAsync(token, signingKey, { algorithms: ['RS256'] });
	} catch (error) {
		throw new Error(`Token verification failed: ${error.message}`);
	}
};

// Get admin token (for Keycloak admin API)
const getAdminToken = async () => {
	try {
		const response = await axios.post(
			`${config.url}/realms/master/protocol/openid-connect/token`,
			new URLSearchParams({
				grant_type: 'password',
				client_id: 'admin-cli',
				username: config.adminUser,
				password: config.adminPassword
			}),
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			}
		);

		return response.data.access_token;
	} catch (error) {
		throw new Error(`Failed to get admin token: ${error.message}`);
	}
};

// Get users from Keycloak
const getKeycloakUsers = async () => {
	try {
		const adminToken = await getAdminToken();
		const response = await axios.get(
			`${config.url}/admin/realms/${config.realm}/users`,
			{
				headers: {
					Authorization: `Bearer ${adminToken}`
				}
			}
		);

		return response.data;
	} catch (error) {
		throw new Error(`Failed to get users: ${error.message}`);
	}
};

// Add this function to get user roles
const getUserRoles = async (userId) => {
	try {
		const adminToken = await getAdminToken();
		const response = await axios.get(
			`${config.url}/admin/realms/${config.realm}/users/${userId}/role-mappings/realm`,
			{
				headers: {
					Authorization: `Bearer ${adminToken}`
				}
			}
		);
		return response.data;
	} catch (error) {
		console.error('Failed to get user roles:', error.message);
		return [];
	}
};

// Transform user data from Keycloak format to app format
const transformUser = async (keycloakUser) => {
	// Get roles for this user
	const roles = await getUserRoles(keycloakUser.id);
	return {
		_id: keycloakUser.id,
		username: keycloakUser.username,
		email: keycloakUser.email || '',
		roles: roles.map(role => role.name)
	}
};

const deleteUser = async (userId) => {
	try {
		// Get admin token
		const token = await getAdminToken();

		const response = await axios.delete(
			`${config.url}/admin/realms/${config.realm}/users/${userId}`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			}
		);

		return true;
	} catch (error) {
		console.error('Keycloak delete user error:', error.message);
		if (error.response && error.response.status === 404) {
			return false; // User not found
		}
		throw error; // Rethrow for other errors
	}
};

module.exports = {
	config,
	verifyToken,
	getAdminToken,
	getKeycloakUsers,
	transformUser,
	deleteUser,
};