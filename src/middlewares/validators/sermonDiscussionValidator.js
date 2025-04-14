const { body, param } = require('express-validator');
const mongoose = require('mongoose');
const SermonSeries = require('../../models/SermonSeries');

const validateSermonDiscussion = [
	body('title')
		.trim()
		.notEmpty()
		.withMessage('Title is required')
		.isLength({ max: 200 })
		.withMessage('Title must be less than 200 characters'),
	body('content').trim().notEmpty().withMessage('Content is required'),
	body('sermonSeries')
		.notEmpty()
		.withMessage('Sermon series ID is required')
		.custom(async (value) => {
			if (!mongoose.Types.ObjectId.isValid(value)) {
				throw new Error('Invalid sermon series ID');
			}
			const series = await SermonSeries.findById(value);
			if (!series) {
				throw new Error('Sermon series not found');
			}
			return true;
		}),
	body('weekNumber')
		.isInt({ min: 1 })
		.withMessage('Week number must be a positive integer')
		.custom(async (value, { req }) => {
			const series = await SermonSeries.findById(req.body.sermonSeries);
			if (series && value > series.numberOfWeeks) {
				throw new Error(
					`Week number cannot exceed the series length of ${series.numberOfWeeks} weeks`
				);
			}
			return true;
		}),
	body('type')
		.optional()
		.isIn(['discussion', 'question', 'reflection'])
		.withMessage('Type must be either discussion, question, or reflection'),
];

const validateComment = [
	body('content')
		.trim()
		.notEmpty()
		.withMessage('Comment content is required')
		.isLength({ max: 1000 })
		.withMessage('Comment must be less than 1000 characters'),
];

const validateDiscussionId = [
	param('discussionId')
		.notEmpty()
		.withMessage('Discussion ID is required')
		.custom((value) => {
			if (!mongoose.Types.ObjectId.isValid(value)) {
				throw new Error('Invalid discussion ID');
			}
			return true;
		}),
];

const validateCommentId = [
	param('commentId')
		.notEmpty()
		.withMessage('Comment ID is required')
		.custom((value) => {
			if (!mongoose.Types.ObjectId.isValid(value)) {
				throw new Error('Invalid comment ID');
			}
			return true;
		}),
];

module.exports = {
	validateSermonDiscussion,
	validateComment,
	validateDiscussionId,
	validateCommentId,
};
