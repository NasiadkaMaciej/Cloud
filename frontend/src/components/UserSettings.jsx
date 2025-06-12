import { useState, useEffect } from 'react';
import { getCurrentUser, deleteUserAccount } from '../services/api';
import { formatBytes } from '../utils';
import { logout } from '../services/keycloak';
import LoadingSpinner from './LoadingSpinner';

const UserSettings = () => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [deletingAccount, setDeletingAccount] = useState(false);

	useEffect(() => {
		fetchUserData();
	}, []);

	const fetchUserData = async () => {
		try {
			setLoading(true);
			const response = await getCurrentUser();
			console.log('User data received:', response.data); // Debug log

			// Make sure we have all required fields with fallbacks
			const userData = {
				...response.data,
				storageQuota: response.data.storageQuota || 0,
				usedStorage: response.data.usedStorage || 0,
				available: response.data.available || 0,
				roles: response.data.roles || []
			};

			setUser(userData);
			setError(null);
		} catch (err) {
			console.error('Error fetching user data:', err);
			setError('Failed to load user data: ' + (err.response?.data?.message || err.message));
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteAccount = async () => {
		if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
			try {
				setDeletingAccount(true);
				await deleteUserAccount();
				logout();
			} catch (err) {
				console.error('Error deleting account:', err);
				setError('Failed to delete account: ' + (err.response?.data?.message || err.message));
				setDeletingAccount(false);
			}
		}
	};

	// Function to filter and display only admin and user roles
	const displayRoles = (roles = []) => {
		const filteredRoles = roles.filter(role => role === 'admin' || role === 'user');
		if (filteredRoles.length === 0) return 'user'; // Default to 'user' if no admin/user role found
		return filteredRoles.join(', ');
	};

	if (loading) {
		return (
			<div className="w-full p-8 flex justify-center items-center">
				<LoadingSpinner size="lg" text="Loading user data..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full p-8">
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
					{error}
				</div>
				<button
					onClick={fetchUserData}
					className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
				>
					Retry
				</button>
			</div>
		);
	}

	// Check if user data is available
	if (!user) {
		return (
			<div className="w-full p-8">
				<div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
					No user data available.
				</div>
				<button
					onClick={fetchUserData}
					className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
				>
					Retry
				</button>
			</div>
		);
	}

	return (
		<div className="w-full p-8">
			<h1 className="text-2xl font-bold mb-6">User Settings</h1>

			<div className="bg-white rounded-lg shadow-md p-6 mb-6">
				<h2 className="text-lg font-semibold mb-4">Account Information</h2>
				<div className="space-y-2">
					<p><span className="font-medium">Username:</span> {user.username || 'N/A'}</p>
					<p><span className="font-medium">Email:</span> {user.email || 'N/A'}</p>
					<p><span className="font-medium">Role:</span> {displayRoles(user.roles)}</p>
				</div>
			</div>

			<div className="bg-white rounded-lg shadow-md p-6 mb-6">
				<h2 className="text-lg font-semibold mb-4">Storage Usage</h2>
				<div className="space-y-2">
					<p><span className="font-medium">Storage Quota:</span> {formatBytes(user.storageQuota || 0)}</p>
					<p><span className="font-medium">Used:</span> {formatBytes(user.usedStorage || 0)}</p>
					<p><span className="font-medium">Available:</span> {formatBytes(user.available || 0)}</p>

					{/* Storage Usage Bar */}
					<div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
						<div
							className="bg-blue-600 h-2.5 rounded-full"
							style={{
								width: `${Math.min(100, ((user.usedStorage || 0) / (user.storageQuota || 1)) * 100)}%`
							}}
						></div>
					</div>
					<p className="text-sm text-gray-500">
						{Math.round(((user.usedStorage || 0) / (user.storageQuota || 1)) * 100)}% used
					</p>
				</div>
			</div>

			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h2>
				<div className="border border-red-300 rounded-lg p-4">
					<h3 className="font-medium">Delete Account</h3>
					<p className="text-sm text-gray-600 mb-3">
						This will permanently delete your account and all your files. This action cannot be undone.
					</p>
					<button
						onClick={handleDeleteAccount}
						disabled={deletingAccount}
						className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:bg-red-300 flex items-center"
					>
						{deletingAccount ? (
							<>
								<LoadingSpinner size="sm" color="white" />
								<span className="ml-2">Deleting...</span>
							</>
						) : (
							'Delete Account'
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default UserSettings;