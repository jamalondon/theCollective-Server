const { body, param, validationResult } = require('express-validator');
const AppError = require('../../utils/AppError');

const uuidRegex =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const validateSermon = [
	body('title')
		.trim()
		.notEmpty()
		.withMessage('Title is required')
		.isLength({ max: 300 })
		.withMessage('Title must be less than 300 characters'),
	body('speakers')
		.optional()
		.isArray()
		.withMessage('Speakers must be an array')
		.custom((arr) => {
			for (const item of arr) {
				if (typeof item !== 'object' || item === null) return false;
				const hasUserId = !!item.user_id;
				const hasName = !!item.name;
				if (!hasUserId && !hasName) return false;
				if (hasUserId && !uuidRegex.test(item.user_id)) return false;
				if (hasName && typeof item.name !== 'string') return false;
			}
			return true;
		})
		.withMessage(
			'Each speaker must be an object with either user_id (uuid) or name (and optional photo)',
		),
	body('keyPoints')
		.optional()
		.isArray()
		.withMessage('Key points must be an array'),
	body('verses').optional().isArray().withMessage('Verses must be an array'),
	body('sermonSeries')
		.optional()
		.custom((value) => {
			if (!uuidRegex.test(value)) throw new Error('Invalid sermon series id');
			return true;
		}),
	handleValidationErrors,
];

const validateSermonId = [
	param('sermonId')
		.notEmpty()
		.withMessage('Sermon id is required')
		.custom((value) => {
			if (!uuidRegex.test(value)) throw new Error('Invalid sermon id format');
			return true;
		}),
	handleValidationErrors,
];

function handleValidationErrors(req, res, next) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const errorMessages = errors.array().map((err) => err.msg);
		return next(new AppError(errorMessages.join(', '), 400));
	}
	next();
}

module.exports = { validateSermon, validateSermonId };
