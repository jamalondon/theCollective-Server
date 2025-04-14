const express = require('express');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');
const { hashPassword, comparePassword } = require('../supabaseSchemas');
const AppError = require('../utils/AppError');
const {
	validateSignup,
	validateSignin,
} = require('../middlewares/validators/authValidator');

const router = express.Router();

router.post('/signup', validateSignup, async (req, res, next) => {
	const { email, password, name, dateOfBirth } = req.body;

	try {
		// Check if user already exists
		const { data: existingUser, error: checkError } = await supabase
			.from('users')
			.select('id')
			.eq('email', email)
			.single();

		if (existingUser) {
			return next(new AppError('Email already in use', 400));
		}

		// Hash the password
		const hashedPassword = await hashPassword(password);

		// Create a new user
		const { data: newUser, error: createError } = await supabase
			.from('users')
			.insert([
				{
					email,
					password: hashedPassword,
					name,
					date_of_birth: dateOfBirth,
				},
			])
			.select()
			.single();

		if (createError) throw createError;

		// Generate a token for the user using jwt
		const token = jwt.sign({ userID: newUser.id }, process.env.JWT_SECRET, {
			expiresIn: '7d',
		});

		// Send the token back to the user with simplified response
		res.status(201).json({
			token,
			userID: newUser.id,
			name: newUser.name,
			email: newUser.email,
			profilePicture: newUser.profile_picture,
		});
	} catch (err) {
		next(err);
	}
});

router.post('/signin', validateSignin, async (req, res, next) => {
	const { email, password } = req.body;

	try {
		// Get user from Supabase
		const { data: user, error: findError } = await supabase
			.from('users')
			.select('*')
			.eq('email', email)
			.single();

		if (findError || !user) {
			return next(new AppError('Invalid email or password', 401));
		}

		// Compare passwords
		const isMatch = await comparePassword(password, user.password);
		if (!isMatch) {
			return next(new AppError('Invalid email or password', 401));
		}

		// Generate JWT token
		const token = jwt.sign({ userID: user.id }, process.env.JWT_SECRET, {
			expiresIn: '7d',
		});

		// Simplified response structure
		res.json({
			token,
			userID: user.id,
			name: user.name,
			email: user.email,
			dateOfBirth: user.date_of_birth,
			profilePicture: user.profile_picture,
		});
	} catch (err) {
		next(err);
	}
});

module.exports = router;
