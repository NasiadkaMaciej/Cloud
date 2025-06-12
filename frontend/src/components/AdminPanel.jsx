import { useState, useEffect } from 'react';
import { getAllUsers, deleteUser, updateUserQuota } from '../services/api';
import { formatBytes } from '../utils';

const AdminPanel = () => {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [editingUser, setEditingUser] = useState(null);
	const [newQuota, setNewQuota] = useState(5);

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

	const handleDeleteUser = async (userId) => {
		if (window.confirm('Are you sure you want to delete this user?')) {
			try {
				await deleteUser(userId);
				await fetchUsers();
			} catch (err) {
				setError('Failed to delete user');
				console.error(err);
			}
		}
	};

	const handleUpdateQuota = async (userId) => {
		try {
			await updateUserQuota(userId, newQuota);
			setEditingUser(null);
			await fetchUsers();
		} catch (err) {
			setError('Failed to update quota');
			console.error(err);
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
								<td colSpan="6" className="px-6 py-4 text-center">Loading...</td>
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
													className="text-green-600 hover:text-green-900"
												>
													Save
												</button>
												<button
													onClick={() => setEditingUser(null)}
													className="text-gray-600 hover:text-gray-900"
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
												className="text-red-600 hover:text-red-900"
											>
												Delete
											</button>
										)}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default AdminPanel;