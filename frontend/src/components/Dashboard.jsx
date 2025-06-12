import { useState, useEffect } from 'react';
import { getFiles, uploadFile, deleteFile, downloadFile } from '../services/api';
import { formatBytes } from '../utils';

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
					<tr><td colSpan="4" className="px-6 py-4 text-center">Loading...</td></tr>
				) : files.length === 0 ? (
					<tr><td colSpan="4" className="px-6 py-4 text-center">No files found</td></tr>
				) : (
					files.map((file) => (
						<tr key={file._id}>
							<td className="px-6 py-4 whitespace-nowrap">{file.fileName}</td>
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

const Dashboard = () => {
	const [files, setFiles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetchFiles();
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

	const handleFileUpload = async (event) => {
		const file = event.target.files[0];
		if (!file) return;

		try {
			setUploading(true);
			await uploadFile(file);
			fetchFiles();
		} catch (err) {
			setError('Failed to upload file');
			console.error(err);
		} finally {
			setUploading(false);
		}
	};

	const handleDeleteFile = async (fileId) => {
		try {
			await deleteFile(fileId);
			fetchFiles();
		} catch (err) {
			setError('Failed to delete file');
			console.error(err);
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

			{/* File upload UI */}
			<div className="bg-white p-6 rounded-lg shadow-md mb-6">
				<h2 className="text-lg font-semibold mb-3">Upload File</h2>
				<div className="flex items-center">
					<input type="file" onChange={handleFileUpload} disabled={uploading}
						className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                        file:rounded-full file:border-0 file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
					{uploading && (
						<div className="ml-3">
							<div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
						</div>
					)}
				</div>
			</div>

			{/* File table component */}
			<div className="bg-white rounded-lg shadow-md overflow-hidden">
				<FileTable
					files={files}
					loading={loading}
					onDownload={handleDownloadFile}
					onDelete={handleDeleteFile}
				/>
			</div>
		</div>
	);
};

export default Dashboard;