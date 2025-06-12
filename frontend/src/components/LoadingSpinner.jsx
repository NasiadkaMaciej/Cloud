import React from 'react';

const LoadingSpinner = () => {
	return (
		<div className="flex justify-center items-center">
			<div
				className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
				aria-label="loading"
			/>
		</div>
	);
};

export default LoadingSpinner;