const jwt = require('jsonwebtoken');
const supabase = require('../supabase');
const { hashPassword, comparePassword } = require('../supabaseSchemas');
const AppError = require('../utils/AppError');
const { startVerification, checkVerification } = require('../utils/twilio');

// Get the Supabase project URL from the client
const SUPABASE_URL = process.env.SUPABASE_URL;
const DEFAULT_PROFILE_PICTURE = `${SUPABASE_URL}/storage/v1/object/public/defaults/default_profile_pic.jpg`;

// Signup controller
exports.signup = async (req, res, next) => {
	const { username, password, name, dateOfBirth, phoneNumber } = req.body;
	try {
		// Check if username already exists
		const { data: existingUsername, error: usernameCheckError } = await supabase
			.from('users')
			.select('id')
			.eq('username', username)
			.single();

		if (existingUsername) {
			return next(new AppError('Username already in use', 400));
		}

		// Check if phone number already exists (only if phone number is provided)
		if (phoneNumber) {
			const { data: existingPhone, error: phoneCheckError } = await supabase
				.from('users')
				.select('id')
				.eq('phone_number', phoneNumber)
				.single();

			if (existingPhone) {
				return next(new AppError('Phone number already in use', 400));
			}
		}

		// Hash the password
		const hashedPassword = await hashPassword(password);

		// Create a new user with default profile picture
		const userData = {
			username,
			password: hashedPassword,
			full_name: name,
			date_of_birth: dateOfBirth,
			profile_picture: DEFAULT_PROFILE_PICTURE,
		};

		// Add phone-related fields only if phone number is provided
		if (phoneNumber) {
			userData.phone_number = phoneNumber;
			userData.verified = false;
		}

		const { data: newUser, error: createError } = await supabase
			.from('users')
			.insert([userData])
			.select()
			.single();

		if (createError) throw createError;

		// If no phone number provided, user is immediately ready to use (no verification needed)
		if (!phoneNumber) {
			// Generate JWT token immediately
			const token = jwt.sign({ userID: newUser.id }, process.env.JWT_SECRET);

			return res.status(201).json({
				token,
				userID: newUser.id,
				username: newUser.username,
				name: newUser.full_name,
				dateOfBirth: newUser.date_of_birth,
				profilePicture: newUser.profile_picture,
				phoneNumber: null,
				role: newUser.role,
				verified: true,
			});
		}

		// If phone number provided, inform client that verification is required
		res.status(201).json({
			verificationRequired: true,
			username: newUser.username,
			phoneNumber: newUser.phone_number,
			userID: newUser.id,
		});
	} catch (err) {
		next(err);
	}
};

// Signup controller without phone verification (for testing and special cases)
exports.signupNoPhone = async (req, res, next) => {
	const { username, password, name, dateOfBirth } = req.body;
	try {
		// Check if username already exists
		const { data: existingUsername, error: usernameCheckError } = await supabase
			.from('users')
			.select('id')
			.eq('username', username)
			.single();

		if (existingUsername) {
			return next(new AppError('Username already in use', 400));
		}

		// Hash the password
		const hashedPassword = await hashPassword(password);

		// Create a new user without phone number
		const userData = {
			username,
			password: hashedPassword,
			full_name: name,
			date_of_birth: dateOfBirth,
			profile_picture: DEFAULT_PROFILE_PICTURE,
			// Explicitly set phone fields to null
			phone_number: null,
			verified: null,
		};

		const { data: newUser, error: createError } = await supabase
			.from('users')
			.insert([userData])
			.select()
			.single();

		if (createError) throw createError;

		// Generate JWT token immediately (no verification needed)
		const token = jwt.sign({ userID: newUser.id }, process.env.JWT_SECRET);

		res.status(201).json({
			token,
			userID: newUser.id,
			username: newUser.username,
			name: newUser.full_name,
			dateOfBirth: newUser.date_of_birth,
			profilePicture: newUser.profile_picture,
			phoneNumber: null,
			role: newUser.role,
			verified: true,
		});
	} catch (err) {
		next(err);
	}
};

// Signin controller
exports.signin = async (req, res, next) => {
	const { username, password } = req.body;

	try {
		// Get user from Supabase
		const { data: user, error: findError } = await supabase
			.from('users')
			.select('*')
			.eq('username', username)
			.single();

		if (findError || !user) {
			return next(new AppError('Invalid username or password', 401));
		}

		// Compare passwords
		const isMatch = await comparePassword(password, user.password);
		if (!isMatch) {
			return next(new AppError('Invalid username or password', 401));
		}

		// If user has a phone number but it's not verified, ask client to verify via SMS
		if (user.phone_number && !user.verified) {
			return res.status(200).json({
				verificationRequired: true,
				username: user.username,
				phoneNumber: user.phone_number,
				userID: user.id,
			});
		}

		// Generate JWT token
		const token = jwt.sign({ userID: user.id }, process.env.JWT_SECRET);

		// Simplified response structure
		res.json({
			token,
			userID: user.id,
			username: user.username,
			name: user.full_name,
			dateOfBirth: user.date_of_birth,
			profilePicture: user.profile_picture,
			phoneNumber: user.phone_number,
			role: user.role,
			verified: user.verified,
		});
	} catch (err) {
		next(err);
	}
};

// Verify token controller
exports.verifyToken = async (req, res, next) => {
	const { token } = req.body;

	if (!token) {
		return next(new AppError('No token provided', 401));
	}

	try {
		// Verify the token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// Get user from Supabase
		const { data: user, error: findError } = await supabase
			.from('users')
			.select('*')
			.eq('id', decoded.userID)
			.single();

		if (findError || !user) {
			return next(new AppError('User not found', 404));
		}

		// Return user information
		res.json({
			token, // Return the same token
			userID: user.id,
			username: user.username,
			name: user.full_name,
			dateOfBirth: user.date_of_birth,
			profilePicture: user.profile_picture,
			phoneNumber: user.phone_number,
			role: user.role,
			verified: user.verified,
		});
	} catch (err) {
		if (err.name === 'JsonWebTokenError') {
			return next(new AppError('Invalid token', 401));
		}
		next(err);
	}
};

// Start SMS verification process
exports.startVerify = async (req, res, next) => {
	const { phoneNumber } = req.body;
	console.log('=== START VERIFY DEBUG ===');
	console.log('phoneNumber received:', phoneNumber);
	console.log('phoneNumber type:', typeof phoneNumber);
	console.log('req.body:', req.body);

	try {
		// Validate phone number exists
		if (!phoneNumber) {
			return next(new AppError('Phone number is required', 400));
		}

		// Check if user exists with this phone number
		const { data: user, error: findError } = await supabase
			.from('users')
			.select('id, verified')
			.eq('phone_number', phoneNumber)
			.single();


		if (findError || !user) {
			return next(new AppError('No user found with this phone number', 404));
		}

		if (user.phone_verified) {
			return res.status(200).json({ message: 'Phone number already verified' });
		}

		// Start Twilio verification
		const verificationResult = await startVerification(phoneNumber);

		if (!verificationResult || !verificationResult.success) {
			const errorMessage =
				verificationResult?.error || 'Unknown error occurred';
			return next(
				new AppError(`Failed to send verification code: ${errorMessage}`, 500)
			);
		}

		res.status(200).json({
			message: 'Verification code sent to your phone number',
			status: verificationResult.status,
		});
	} catch (err) {
		next(err);
	}
};

// Check SMS verification code
exports.checkVerify = async (req, res, next) => {
	const { phoneNumber, code } = req.body;

	try {
		// Check if user exists with this phone number
		const { data: user, error: findError } = await supabase
			.from('users')
			.select('*')
			.eq('phone_number', phoneNumber)
			.single();

		if (findError || !user) {
			return next(new AppError('No user found with this phone number', 404));
		}

		if (user.verified) {
			// Already verified; issue token
			const token = jwt.sign({ userID: user.id }, process.env.JWT_SECRET);
			return res.status(200).json({
				token,
				userID: user.id,
				username: user.username,
				name: user.full_name,
				dateOfBirth: user.date_of_birth,
				profilePicture: user.profile_picture,
				phoneNumber: user.phone_number,
				role: user.role,
				verified: user.verified,
			});
		}

		// Check verification code with Twilio
		const verificationResult = await checkVerification(phoneNumber, code);

		if (!verificationResult.success) {
			return next(new AppError('Failed to verify code', 500));
		}

		if (!verificationResult.valid) {
			return next(new AppError('Invalid verification code', 400));
		}

		// Mark phone as verified
		const { error: updateError } = await supabase
			.from('users')
			.update({
				verified: true,
			})
			.eq('id', user.id);

		if (updateError) throw updateError;

		// Issue token
		const token = jwt.sign({ userID: user.id }, process.env.JWT_SECRET);
		res.status(200).json({
			token,
			userID: user.id,
			username: user.username,
			name: user.full_name,
			dateOfBirth: user.date_of_birth,
			profilePicture: user.profile_picture,
			phoneNumber: user.phone_number,
			role: user.role,
			verified: user.verified,
		});
	} catch (err) {
		next(err);
	}
};
