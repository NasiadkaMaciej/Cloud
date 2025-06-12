import { Link } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
	return (
		<nav className="bg-blue-600 text-white shadow-md">
			<div className="container mx-auto px-4">
				<div className="flex justify-between items-center py-4">
					<div className="text-xl font-bold">Personal Cloud</div>

					<div className="flex items-center space-x-4">
						{user && (
							<>
								<span>Welcome, {user.username}</span>
								<Link to="/" className="hover:text-blue-200">Dashboard</Link>
								{user.isAdmin && (
									<Link to="/admin" className="hover:text-blue-200">Admin Panel</Link>
								)}
								<button
									onClick={onLogout}
									className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
								>
									Logout
								</button>
							</>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;