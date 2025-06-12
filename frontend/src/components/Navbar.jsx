import { Link } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
	return (
		<nav className="bg-white shadow-md">
			<div className="max-w-7xl mx-auto px-4">
				<div className="flex justify-between h-16">
					<div className="flex items-center">
						<Link to="/" className="text-xl font-bold text-blue-600">
							Secure File Storage
						</Link>
					</div>

					{user && (
						<div className="flex items-center space-x-4">
							<Link to="/" className="text-gray-700 hover:text-blue-600">
								Files
							</Link>

							<Link to="/settings" className="text-gray-700 hover:text-blue-600">
								Settings
							</Link>

							{user.isAdmin && (
								<Link to="/admin" className="text-gray-700 hover:text-blue-600">
									Admin
								</Link>
							)}

							<button
								onClick={onLogout}
								className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
							>
								Logout
							</button>
						</div>
					)}
				</div>
			</div>
		</nav>
	);
};

export default Navbar;