import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initKeycloak, getUserInfo, logout } from './services/keycloak';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import Navbar from './components/Navbar';
import UserSettings from './components/UserSettings';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
	const [initialized, setInitialized] = useState(false);
	const [user, setUser] = useState(null);

	useEffect(() => {
		const initAuth = async () => {
			await initKeycloak(() => {
				setUser(getUserInfo());
				setInitialized(true);
			});
		};

		initAuth();
	}, []);

	if (!initialized) {
		return (
			<div className="h-screen flex items-center justify-center bg-gray-100">
				<div className="text-center">
					<LoadingSpinner size="xl" />
					<p className="mt-4 text-gray-600">Initializing application...</p>
				</div>
			</div>
		);
	}

	return (
		<Router>
			<div className="bg-gray-100 h-full">
				<Navbar user={user} onLogout={logout} />
				<div className="w-full">
					<Routes>
						<Route path="/" element={<Dashboard />} />
						{user && user.isAdmin && (
							<Route path="/admin" element={<AdminPanel />} />
						)}
						{user && (
							<Route path="/settings" element={<UserSettings />} />
						)}
						<Route path="*" element={<Navigate to="/" replace />} />
					</Routes>
				</div>
			</div>
		</Router>
	);
}

export default App;