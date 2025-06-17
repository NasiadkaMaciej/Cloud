import { useState, useEffect } from 'react';
import { formatBytes } from '../utils';
import { getAllUsers, deleteUser, updateUserQuota, cleanupSystem } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const AdminPanel = () => {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [editingUser, setEditingUser] = useState(null);
	const [newQuota, setNewQuota] = useState(5);
	const [cleanupStatus, setCleanupStatus] = useState(null);
	const [isCleaningUp, setIsCleaningUp] = useState(false);
	const [deletingUsers, setDeletingUsers] = useState({});
	const [updatingQuota, setUpdatingQuota] = useState(false);

	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			const response = await getAllUsers();
			setUsers(response.data);
			setError(null);
		} catch (err) {
			setError('Failed to load users');
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const updateUserInList = (userId, updates) => {
		setUsers(prevUsers =>
			prevUsers.map(user =>
				user._id === userId ? { ...user, ...updates } : user
			)
		);
	};

	const handleDeleteUser = async (userId) => {
		if (window.confirm('Are you sure you want to delete this user?')) {
			try {
				setDeletingUsers(prev => ({ ...prev, [userId]: true }));
				await deleteUser(userId);
				setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
			} catch (err) {
				setError('Failed to delete user');
				console.error(err);
			} finally {
				setDeletingUsers(prev => ({ ...prev, [userId]: false }));
			}
		}
	};

	const handleUpdateQuota = async (userId) => {
		try {
			setUpdatingQuota(true);
			await updateUserQuota(userId, newQuota);

			const quotaInBytes = newQuota * 1024 * 1024 * 1024;
			updateUserInList(userId, { storageQuota: quotaInBytes });

			setEditingUser(null);
		} catch (err) {
			setError('Failed to update quota');
			console.error(err);
		} finally {
			setUpdatingQuota(false);
		}
	};

	const handleSystemCleanup = async () => {
		if (window.confirm('Are you sure you want to clean up the system? This will remove orphaned files and database entries.')) {
			try {
				setIsCleaningUp(true);
				const response = await cleanupSystem();
				setCleanupStatus({
					success: true,
					message: `Cleanup completed: ${response.data.orphanedDbEntriesRemoved} database entries and ${response.data.orphanedFilesRemoved} files removed.`
				});
			} catch (err) {
				setCleanupStatus({
					success: false,
					message: 'Failed to clean up system: ' + (err.response?.data?.message || err.message)
				});
			} finally {
				setIsCleaningUp(false);
			}
		}
	};

	return (
		<div className="w-full p-8">
			<h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
					{error}
				</div>
			)}

			<div className="bg-white rounded-lg shadow-md overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage Used</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quota</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{loading ? (
							<tr>
								<td colSpan="6" className="px-6 py-8 text-center">
									<LoadingSpinner size="md" fullWidth text="Loading users..." />
								</td>
							</tr>
						) : users.length === 0 ? (
							<tr>
								<td colSpan="6" className="px-6 py-4 text-center">No users found</td>
							</tr>
						) : (
							users.map((user) => (
								<tr key={user._id}>
									<td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
									<td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.roles && user.roles.includes('admin') ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
											}`}>
											{user.roles && user.roles.includes('admin') ? 'admin' : 'user'}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										{formatBytes(user.usedStorage)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										{editingUser === user._id ? (
											<div className="flex items-center space-x-2">
												<input
													type="number"
													value={newQuota}
													onChange={(e) => setNewQuota(e.target.value)}
													className="w-16 px-2 py-1 border rounded"
													min="1"
													max="30"
												/>
												<span>GB</span>
												<button
													onClick={() => handleUpdateQuota(user._id)}
													disabled={updatingQuota}
													className="text-green-600 hover:text-green-900 disabled:text-gray-400 flex items-center"
												>
													{updatingQuota ? (
														<>
															<LoadingSpinner size="sm" />
															<span className="ml-1">Saving</span>
														</>
													) : (
														'Save'
													)}
												</button>
												<button
													onClick={() => setEditingUser(null)}
													className="text-gray-600 hover:text-gray-900"
													disabled={updatingQuota}
												>
													Cancel
												</button>
											</div>
										) : (
											<div className="flex items-center space-x-2">
												<span>{formatBytes(user.storageQuota)}</span>
												<button
													onClick={() => {
														setEditingUser(user._id);
														setNewQuota(user.storageQuota / (1024 * 1024 * 1024));
													}}
													className="text-blue-600 hover:text-blue-900"
												>
													Edit
												</button>
											</div>
										)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										{(!user.roles || !user.roles.includes('admin')) && (
											<button
												onClick={() => handleDeleteUser(user._id)}
												disabled={deletingUsers[user._id]}
												className="text-red-600 hover:text-red-900 disabled:text-gray-400 flex items-center"
											>
												{deletingUsers[user._id] ? (
													<>
														<LoadingSpinner size="sm" />
														<span className="ml-1">Deleting...</span>
													</>
												) : (
													'Delete'
												)}
											</button>
										)}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
			<div className="mt-8 bg-white rounded-lg shadow-md p-6">
				<h2 className="text-xl font-bold mb-4">System Maintenance</h2>

				{cleanupStatus && (
					<div className={`p-4 mb-4 rounded ${cleanupStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
						{cleanupStatus.message}
					</div>
				)}

				<button
					onClick={handleSystemCleanup}
					disabled={isCleaningUp}
					className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md disabled:bg-gray-400 flex items-center"
				>
					{isCleaningUp ? (
						<>
							<LoadingSpinner size="sm" color="white" />
							<span className="ml-2">Cleaning...</span>
						</>
					) : (
						'Clean Up System'
					)}
				</button>
				<p className="mt-2 text-sm text-gray-600">
					This will remove orphaned files and database entries.
				</p>
			</div>
		</div>
	);
};

export default AdminPanel;