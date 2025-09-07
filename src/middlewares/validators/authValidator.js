const { body, validationResult } = require('express-validator');
const AppError = require('../../utils/AppError');

const validateSignup = [
	body('email')
		.isEmail()
		.withMessage('Please provide a valid email address')
		.normalizeEmail(),
	body('password')
		.isLength({ min: 8 })
		.withMessage('Password must be at least 8 characters long')
		.matches(/\d/)
		.withMessage('Password must contain at least one number')
		.matches(/[a-z]/)
		.withMessage('Password must contain at least one lowercase letter')
		.matches(/[A-Z]/)
		.withMessage('Password must contain at least one uppercase letter'),
	body('name')
		.trim()
		.notEmpty()
		.withMessage('Name is required')
		.isLength({ min: 2 })
		.withMessage('Name must be at least 2 characters long'),
	body('dateOfBirth')
		.isISO8601()
		.withMessage(
			'Please provide a valid date of birth in ISO format (YYYY-MM-DD)'
		),
	body('phoneNumber')
		.matches(/^\+[1-9]\d{1,14}$/)
		.withMessage('Please provide a valid phone number in E.164 format (e.g., +1234567890)'),
	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			const errorMessages = errors.array().map((err) => err.msg);
			return next(new AppError(errorMessages.join(', '), 400));
		}
		next();
	},
];

const validateSignin = [
	body('email')
		.isEmail()
		.withMessage('Please provide a valid email address')
		.normalizeEmail(),
	body('password').notEmpty().withMessage('Password is required'),
	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			const errorMessages = errors.array().map((err) => err.msg);
			return next(new AppError(errorMessages.join(', '), 400));
		}
		next();
	},
];

const validateStartVerify = [
	body('phoneNumber')
		.matches(/^\+[1-9]\d{1,14}$/)
		.withMessage('Please provide a valid phone number in E.164 format (e.g., +1234567890)'),
	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			const errorMessages = errors.array().map((err) => err.msg);
			return next(new AppError(errorMessages.join(', '), 400));
		}
		next();
	},
];

const validateCheckVerify = [
	body('phoneNumber')
		.matches(/^\+[1-9]\d{1,14}$/)
		.withMessage('Please provide a valid phone number in E.164 format (e.g., +1234567890)'),
	body('code')
		.isLength({ min: 4, max: 6 })
		.withMessage('Verification code must be 4-6 characters long')
		.matches(/^\d+$/)
		.withMessage('Verification code must contain only numbers'),
	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			const errorMessages = errors.array().map((err) => err.msg);
			return next(new AppError(errorMessages.join(', '), 400));
		}
		next();
	},
];

module.exports = {
	validateSignup,
	validateSignin,
	validateStartVerify,
	validateCheckVerify,
};
