import { useState, useEffect } from 'react';
import { getFiles, uploadFile, deleteFile, downloadFile, getCurrentUser } from '../services/api';
import { formatBytes } from '../utils';
import LoadingSpinner from './LoadingSpinner';

// File type icons - we'll determine file type based on extension
const getFileIcon = (fileName) => {
	const extension = fileName.split('.').pop().toLowerCase();

	const iconMap = {
		pdf: "far fa-file-pdf",
		doc: "far fa-file-word",
		docx: "far fa-file-word",
		xls: "far fa-file-excel",
		xlsx: "far fa-file-excel",
		ppt: "far fa-file-powerpoint",
		pptx: "far fa-file-powerpoint",
		txt: "far fa-file-alt",
		csv: "far fa-file-csv",
		jpg: "far fa-file-image",
		jpeg: "far fa-file-image",
		png: "far fa-file-image",
		gif: "far fa-file-image",
		zip: "far fa-file-archive",
		rar: "far fa-file-archive",
		mp3: "far fa-file-audio",
		mp4: "far fa-file-video",
		js: "far fa-file-code",
		jsx: "far fa-file-code",
		html: "far fa-file-code",
		css: "far fa-file-code",
	};

	return iconMap[extension] || "far fa-file";
};


// Original table view component
const FileTable = ({ files, onDownload, onDelete, loading }) => {
	return (
		<table className="min-w-full divide-y divide-gray-200">
			<thead className="bg-gray-50">
				<tr>
					<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						File Name
					</th>
					<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Size
					</th>
					<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Upload Date
					</th>
					<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Actions
					</th>
				</tr>
			</thead>
			<tbody className="bg-white divide-y divide-gray-200">
				{loading ? (
					<tr>
						<td colSpan="4" className="px-6 py-8 text-center">
							<LoadingSpinner size="md" fullWidth text="Loading files..." />
						</td>
					</tr>
				) : files.length === 0 ? (
					<tr><td colSpan="4" className="px-6 py-4 text-center">No files found</td></tr>
				) : (
					files.map((file) => (
						<tr key={file._id}>
							<td className="px-6 py-4 whitespace-nowrap">
								<div className="flex items-center">
									<i className={`${getFileIcon(file.fileName)} text-gray-500 mr-3`}></i>
									{file.fileName}
								</div>
							</td>
							<td className="px-6 py-4 whitespace-nowrap">{formatBytes(file.fileSize)}</td>
							<td className="px-6 py-4 whitespace-nowrap">
								{new Date(file.createdAt).toLocaleDateString()}
							</td>
							<td className="px-6 py-4 whitespace-nowrap space-x-2">
								<button
									onClick={() => onDownload(file._id, file.fileName)}
									className="text-blue-600 hover:text-blue-900 mr-2"
								>
									Download
								</button>
								<button
									onClick={() => onDelete(file._id)}
									className="text-red-600 hover:text-red-900"
								>
									Delete
								</button>
							</td>
						</tr>
					))
				)}
			</tbody>
		</table>
	);
};

// File Grid Component
const FileGrid = ({ files, onDownload, onDelete, loading }) => {
	if (loading) {
		return (
			<div className="w-full flex justify-center py-12">
				<LoadingSpinner size="md" fullWidth text="Loading files..." />
			</div>
		);
	}

	if (files.length === 0) {
		return (
			<div className="w-full py-16 text-center text-gray-500">
				<i className="far fa-folder-open text-5xl mb-4"></i>
				<p>No files found</p>
				<p className="text-sm mt-2">Upload a file to get started</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
			{files.map((file) => (
				<div
					key={file._id}
					className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col"
				>
					{/* File Icon */}
					<div className="h-24 bg-gray-50 flex items-center justify-center">
						<i className={`${getFileIcon(file.fileName)} text-3xl text-gray-500`}></i>
					</div>

					{/* File Info */}
					<div className="p-3 flex-grow">
						<div className="truncate font-medium text-sm" title={file.fileName}>
							{file.fileName}
						</div>
						<div className="text-xs text-gray-500 mt-1">
							{formatBytes(file.fileSize)}
						</div>
						<div className="text-xs text-gray-400">
							{new Date(file.createdAt).toLocaleDateString()}
						</div>
					</div>

					{/* Actions */}
					<div className="flex justify-between p-3 border-t border-gray-100">
						<button
							onClick={() => onDownload(file._id, file.fileName)}
							className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
							title="Download"
						>
							<i className="fas fa-download mr-1"></i>
							<span>Download</span>
						</button>

						<button
							onClick={() => onDelete(file._id)}
							className="text-red-600 hover:text-red-800 flex items-center text-sm"
							title="Delete"
						>
							<i className="fas fa-trash-alt mr-1"></i>
							<span>Delete</span>
						</button>
					</div>
				</div>
			))}
		</div>
	);
};

const Dashboard = () => {
	const [files, setFiles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState(null);
	const [quotaInfo, setQuotaInfo] = useState(null);
	const [quotaLoading, setQuotaLoading] = useState(true);
	const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

	useEffect(() => {
		fetchFiles();
		fetchUserQuota();
	}, []);

	const fetchFiles = async () => {
		try {
			setLoading(true);
			const response = await getFiles();
			setFiles(response.data);
			setError(null);
		} catch (err) {
			setError('Failed to load files');
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const fetchUserQuota = async () => {
		try {
			setQuotaLoading(true);
			const response = await getCurrentUser();
			setQuotaInfo({
				used: response.data.usedStorage,
				total: response.data.storageQuota,
				available: response.data.available
			});
		} catch (err) {
			console.error('Failed to load quota information:', err);
		} finally {
			setQuotaLoading(false);
		}
	};

	const handleFileUpload = async (event) => {
		const file = event.target.files[0];
		if (!file) return;

		// Reset any previous error
		setError(null);

		const MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024; // 1GB
		if (file.size > MAX_FILE_SIZE) {
			setError(`File size exceeds the maximum allowed size of ${formatBytes(MAX_FILE_SIZE)}`);
			// Clear the file input
			event.target.value = '';
			return;
		}

		// Check if file will fit in the user's remaining quota
		if (quotaInfo) {
			const remainingSpace = quotaInfo.available;
			if (file.size > remainingSpace) {
				setError(`Not enough storage space. You have ${formatBytes(remainingSpace)} available but the file is ${formatBytes(file.size)}`);
				// Clear the file input
				event.target.value = '';
				return;
			}
		}

		try {
			setUploading(true);
			await uploadFile(file);
			await fetchFiles();
			await fetchUserQuota();
		} catch (err) {
			setError('Failed to upload file');
			console.error(err);
		} finally {
			setUploading(false);
			// Clear the file input
			event.target.value = '';
		}
	};

	const handleDeleteFile = async (fileId) => {
		if (window.confirm('Are you sure you want to delete this file?')) {
			try {
				await deleteFile(fileId);
				await fetchFiles();
				await fetchUserQuota();
			} catch (err) {
				setError('Failed to delete file');
				console.error(err);
			}
		}
	};

	const handleDownloadFile = async (fileId, fileName) => {
		try {
			await downloadFile(fileId, fileName);
		} catch (err) {
			setError('Failed to download file');
			console.error(err);
		}
	};

	return (
		<div className="w-full p-8">
			<h1 className="text-2xl font-bold mb-6">My Files</h1>

			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
					{error}
				</div>
			)}

			{/* Storage quota display */}
			<div className="bg-white p-4 rounded-lg shadow-md mb-6">
				<h2 className="text-lg font-semibold mb-2">Storage</h2>
				{quotaLoading ? (
					<LoadingSpinner size="sm" fullWidth text="Loading storage info..." />
				) : quotaInfo ? (
					<>
						<div className="flex justify-between mb-1">
							<span>{formatBytes(quotaInfo.used)} used of {formatBytes(quotaInfo.total)}</span>
							<span>{formatBytes(quotaInfo.available)} available</span>
						</div>
						<div className="w-full bg-gray-200 rounded-full h-2.5">
							<div
								className="bg-blue-600 h-2.5 rounded-full"
								style={{ width: `${Math.min(100, (quotaInfo.used / quotaInfo.total) * 100)}%` }}
							></div>
						</div>
					</>
				) : (
					<p>Storage information not available</p>
				)}
			</div>

			{/* File upload UI */}
			<div className="bg-white p-6 rounded-lg shadow-md mb-6">
				<h2 className="text-lg font-semibold mb-3">Upload File</h2>
				<div className="flex items-center">
					<input type="file" onChange={handleFileUpload} disabled={uploading}
						className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                        file:rounded-full file:border-0 file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
					{uploading && <LoadingSpinner size="sm" text="Uploading..." />}
				</div>
			</div>

			{/* View toggle */}
			<div className="bg-white rounded-lg shadow-md p-4 mb-6">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Files</h2>
					<div className="flex space-x-2">
						<button
							onClick={() => setViewMode('grid')}
							className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
						>
							<i className="fas fa-th-large"></i>
						</button>
						<button
							onClick={() => setViewMode('list')}
							className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
						>
							<i className="fas fa-list"></i>
						</button>
					</div>
				</div>
			</div>

			{/* File display */}
			<div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
				{viewMode === 'grid' ? (
					<FileGrid
						files={files}
						loading={loading}
						onDownload={handleDownloadFile}
						onDelete={handleDeleteFile}
					/>
				) : (
					<FileTable
						files={files}
						loading={loading}
						onDownload={handleDownloadFile}
						onDelete={handleDeleteFile}
					/>
				)}
			</div>
		</div>
	);
};

export default Dashboard;