const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	_id: {
		type: String,
		required: true
	},
	storageQuota: {
		type: Number,
		default: 5 * 1024 * 1024 * 1024, // 5 GB
	},
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);