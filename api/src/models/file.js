const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
	userId: {
		type: String,
		required: true,
		ref: 'User'
	},
	fileName: {
		type: String,
		required: true
	},
	fileSize: {
		type: Number,
		required: true
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	updatedAt: {
		type: Date,
		default: Date.now
	}
});

fileSchema.pre('save', function (next) {
	this.updatedAt = Date.now();
	next();
});

const File = mongoose.model('File', fileSchema);

module.exports = File;