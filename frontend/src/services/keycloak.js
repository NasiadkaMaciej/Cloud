import Keycloak from 'keycloak-js';

const keycloakConfig = {
	url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
	realm: import.meta.env.VITE_KEYCLOAK_REALM || 'personal-cloud',
	clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'frontend-client'
};

const keycloak = new Keycloak(keycloakConfig);
let isInitialized = false;
let initPromise = null;

export const initKeycloak = (onAuthenticatedCallback) => {
	if (!initPromise) {
		initPromise = new Promise((resolve, reject) => {
			keycloak.init({
				onLoad: 'login-required', // Change from 'check-sso' to 'login-required'
				silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
				checkLoginIframe: false,
				pkceMethod: 'S256'
			})
				.then((authenticated) => {
					isInitialized = true;
					resolve(authenticated);
				})
				.catch(error => {
					console.error("Keycloak init error:", error);
					reject(error);
				});
		});
	}

	return initPromise
		.then((authenticated) => {
			if (authenticated) {
				onAuthenticatedCallback();
				return true;
			} else {
				console.warn("Not authenticated!");
				keycloak.login();
				return false;
			}
		})
		.catch(error => {
			console.error("Error handling keycloak init:", error);
			return false;
		});
};

export const getUserInfo = () => {
	return {
		isAuthenticated: keycloak.authenticated,
		username: keycloak.tokenParsed?.preferred_username,
		email: keycloak.tokenParsed?.email,
		roles: keycloak.tokenParsed?.realm_access?.roles || [],
		isAdmin: keycloak.tokenParsed?.realm_access?.roles?.includes('admin') || false
	};
};

export const getToken = () => keycloak.token;

export const updateToken = (minValidity = 5) => {
	return new Promise((resolve, reject) => {
		keycloak.updateToken(minValidity)
			.then(refreshed => {
				resolve(keycloak.token);
			})
			.catch(error => {
				reject(error);
			});
	});
};

export const logout = () => keycloak.logout();

export default keycloak;