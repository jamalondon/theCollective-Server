const mongoose = require('mongoose');

const sermonSeriesSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
		},
		numberOfWeeks: {
			type: Number,
			required: true,
			min: 1,
		},
		coverImage: {
			url: {
				type: String,
				required: true,
			},
			publicId: {
				type: String,
				required: true,
			},
		},
		startDate: {
			type: Date,
			required: true,
		},
		endDate: {
			type: Date,
			required: true,
		},
		status: {
			type: String,
			enum: ['upcoming', 'current', 'completed'],
			default: 'upcoming',
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			transform: function (doc, ret) {
				ret.id = ret._id;
				delete ret._id;
				delete ret.__v;
				return ret;
			},
		},
		toObject: { virtuals: true },
	}
);

// Virtual field to get all sermon discussions in this series
sermonSeriesSchema.virtual('sermonDiscussions', {
	ref: 'SermonDiscussion',
	localField: '_id',
	foreignField: 'sermonSeries',
});

// Indexes for better query performance
sermonSeriesSchema.index({ title: 'text', description: 'text' });
sermonSeriesSchema.index({ status: 1, startDate: 1 });

module.exports = mongoose.model('SermonSeries', sermonSeriesSchema);
