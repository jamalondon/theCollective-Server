const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		attendees: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		location: {
			type: String,
			required: true,
		},
		date: {
			type: Date,
			required: true,
		},
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		createdAtFormatted: String,
		updatedAtFormatted: String,
	},
	{
		timestamps: true, // Adds createdAt and updatedAt fields automatically
	}
);

// Pre-save middleware to format dates before saving to database
eventSchema.pre('save', function (next) {
	const options = {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	};

	// Format createdAt if it's a new document
	if (this.isNew) {
		this.createdAtFormatted = new Date().toLocaleString('en-US', options);
	}

	// Always update the formatted updatedAt date
	this.updatedAtFormatted = new Date().toLocaleString('en-US', options);

	next();
});

// Also update the formatted dates when the document is updated
eventSchema.pre('findOneAndUpdate', function (next) {
	const options = {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	};

	this.set({ updatedAtFormatted: new Date().toLocaleString('en-US', options) });
	next();
});

mongoose.model('Event', eventSchema);
