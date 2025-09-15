const { body, param } = require('express-validator');
const supabase = require('../../supabase');

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
			// Check if it's a valid UUID format (Supabase uses UUIDs)
			const uuidRegex =
				/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			if (!uuidRegex.test(value)) {
				throw new Error('Invalid sermon series ID format');
			}

			const { data: series, error } = await supabase
				.from('sermon_series')
				.select('id, number_of_weeks')
				.eq('id', value)
				.single();

			if (error || !series) {
				throw new Error('Sermon series not found');
			}
			return true;
		}),
	body('weekNumber')
		.isInt({ min: 1 })
		.withMessage('Week number must be a positive integer')
		.custom(async (value, { req }) => {
			if (req.body.sermonSeries) {
				const { data: series, error } = await supabase
					.from('sermon_series')
					.select('number_of_weeks')
					.eq('id', req.body.sermonSeries)
					.single();

				if (!error && series && value > series.number_of_weeks) {
					throw new Error(
						`Week number cannot exceed the series length of ${series.number_of_weeks} weeks`
					);
				}
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
			const uuidRegex =
				/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			if (!uuidRegex.test(value)) {
				throw new Error('Invalid discussion ID format');
			}
			return true;
		}),
];

const validateCommentId = [
	param('commentId')
		.notEmpty()
		.withMessage('Comment ID is required')
		.custom((value) => {
			const uuidRegex =
				/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			if (!uuidRegex.test(value)) {
				throw new Error('Invalid comment ID format');
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
