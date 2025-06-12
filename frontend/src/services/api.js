import axios from 'axios';
import { getToken, updateToken } from './keycloak';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
	baseURL: API_URL,
	headers: {
		'Content-Type': 'application/json'
	}
});

api.interceptors.request.use(
	async (config) => {
		const token = await getToken();
		if (token) config.headers.Authorization = `Bearer ${token}`;
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// File services
export const uploadFile = (file) => {
	const formData = new FormData();
	formData.append('file', file);

	return api.post('/files/upload', formData, {
		headers: {
			'Content-Type': 'multipart/form-data'
		}
	});
};

export const getFiles = () => api.get('/files');

export const deleteFile = (fileId) => api.delete(`/files/${fileId}`);

// Admin services
export const getAllUsers = () => api.get('/admin/users');

export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`);

export const getUserQuota = (userId) => api.get(`/admin/users/${userId}/quota`);

export const updateUserQuota = (userId, quota) => {
	return api.post(`/admin/users/${userId}/quota`, { quota })
};

export const downloadFile = (fileId, fileName) => {
	return api.get(`/files/${fileId}/download`, {
		responseType: 'blob'
	}).then(response => {
		const url = window.URL.createObjectURL(new Blob([response.data]));
		const link = document.createElement('a');
		link.href = url;
		link.setAttribute('download', fileName);
		document.body.appendChild(link);
		link.click();
		link.remove();
	});
};

export default api;