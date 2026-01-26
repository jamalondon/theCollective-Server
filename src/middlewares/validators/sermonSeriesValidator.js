const { body, param, validationResult } = require('express-validator');
const AppError = require('../../utils/AppError');

const validateSermonSeriesCreate = [
	body('title')
		.trim()
		.notEmpty()
		.withMessage('Title is required')
		.isLength({ min: 3, max: 100 })
		.withMessage('Title must be between 3 and 100 characters'),
	body('description')
		.trim()
		.notEmpty()
		.withMessage('Description is required')
		.isLength({ min: 10, max: 1000 })
		.withMessage('Description must be between 10 and 1000 characters'),
	body('numberOfWeeks')
		.optional({ nullable: true })
		.isInt({ min: 1, max: 52 })
		.withMessage('Number of weeks must be between 1 and 52'),
	body('startDate')
		.notEmpty()
		.withMessage('Start date is required')
		.isISO8601()
		.withMessage('Invalid start date format'),
	body('endDate')
		.optional({ nullable: true })
		.isISO8601()
		.withMessage('Invalid end date format')
		.custom((value, { req }) => {
			if (!value) return true;
			const endDate = new Date(value);
			if (req.body.startDate) {
				const startDate = new Date(req.body.startDate);
				if (endDate <= startDate) {
					throw new Error('End date must be after start date');
				}
			}
			return true;
		}),
	body('status')
		.optional()
		.isIn(['upcoming', 'ongoing', 'completed'])
		.withMessage('Invalid status value'),
	body('tags')
		.optional()
		.isArray()
		.withMessage('Tags must be an array')
		.custom((value) => {
			if (value && value.length > 10) {
				throw new Error('Maximum 10 tags allowed');
			}
			if (value && !value.every((tag) => typeof tag === 'string')) {
				throw new Error('All tags must be strings');
			}
			return true;
		}),
	// coverImage is optional and can be null; if provided validate shape
	body('coverImage')
		.optional({ nullable: true })
		.custom((value) => {
			if (!value) return true;
			if (typeof value !== 'object')
				throw new Error('coverImage must be an object');
			if (!value.url || typeof value.url !== 'string') {
				throw new Error('coverImage.url is required');
			}
			if (!value.publicId || typeof value.publicId !== 'string') {
				throw new Error('coverImage.publicId is required');
			}
			return true;
		}),
	handleValidationErrors,
];

const validateSermonSeriesUpdate = [
	body('title')
		.optional()
		.trim()
		.isLength({ min: 3, max: 100 })
		.withMessage('Title must be between 3 and 100 characters'),
	body('description')
		.optional()
		.trim()
		.isLength({ min: 10, max: 1000 })
		.withMessage('Description must be between 10 and 1000 characters'),
	body('numberOfWeeks')
		.optional({ nullable: true })
		.isInt({ min: 1, max: 52 })
		.withMessage('Number of weeks must be between 1 and 52'),
	body('startDate')
		.optional()
		.isISO8601()
		.withMessage('Start date must be a valid date'),
	body('endDate')
		.optional({ nullable: true })
		.isISO8601()
		.withMessage('End date must be a valid date')
		.custom((endDate, { req }) => {
			if (
				req.body.startDate &&
				new Date(endDate) <= new Date(req.body.startDate)
			) {
				throw new Error('End date must be after start date');
			}
			return true;
		}),
	body('status')
		.optional()
		.isIn(['upcoming', 'ongoing', 'completed'])
		.withMessage('Invalid status value'),
	body('tags')
		.optional()
		.isArray()
		.withMessage('Tags must be an array')
		.custom((value) => {
			if (value && value.length > 10) {
				throw new Error('Maximum 10 tags allowed');
			}
			if (value && !value.every((tag) => typeof tag === 'string')) {
				throw new Error('All tags must be strings');
			}
			return true;
		}),
	// coverImage optional on update as well
	body('coverImage')
		.optional({ nullable: true })
		.custom((value) => {
			if (!value) return true;
			if (typeof value !== 'object')
				throw new Error('coverImage must be an object');
			if (!value.url || typeof value.url !== 'string') {
				throw new Error('coverImage.url is required');
			}
			if (!value.publicId || typeof value.publicId !== 'string') {
				throw new Error('coverImage.publicId is required');
			}
			return true;
		}),
	handleValidationErrors,
];

const validateSeriesId = [
	param('seriesId')
		.notEmpty()
		.withMessage('Series ID is required')
		.custom((value) => {
			const uuidRegex =
				/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			if (!uuidRegex.test(value)) {
				throw new Error('Invalid series ID format');
			}
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

module.exports = {
	validateSermonSeriesCreate,
	validateSermonSeriesUpdate,
	validateSeriesId,
};
