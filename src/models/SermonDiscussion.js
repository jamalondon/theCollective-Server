const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
	{
		content: {
			type: String,
			required: true,
			trim: true,
		},
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{ timestamps: true }
);

const sermonDiscussionSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		content: {
			type: String,
			required: true,
		},
		sermonSeries: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'SermonSeries',
			required: true,
		},
		weekNumber: {
			type: Number,
			required: true,
			min: 1,
		},
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		type: {
			type: String,
			enum: ['discussion', 'question', 'reflection'],
			default: 'discussion',
		},
		comments: [commentSchema],
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

// Ensure combination of sermonSeries and weekNumber exists
sermonDiscussionSchema.index({ sermonSeries: 1, weekNumber: 1 });

// Text search index
sermonDiscussionSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('SermonDiscussion', sermonDiscussionSchema);
