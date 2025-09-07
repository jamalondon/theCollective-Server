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
	const { email, password, name, dateOfBirth, phoneNumber } = req.body;
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

		// Check if phone number already exists
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
		const { data: newUser, error: createError } = await supabase
			.from('users')
			.insert([
				{
					email,
					password: hashedPassword,
					name,
					date_of_birth: dateOfBirth,
					profile_picture: DEFAULT_PROFILE_PICTURE,
					phone_number: phoneNumber,
					phone_verified: false,
				},
			])
			.select()
			.single();

		if (createError) throw createError;

		// Inform client that verification is required
		res.status(201).json({
			verificationRequired: true,
			email: newUser.email,
			phoneNumber: newUser.phone_number,
			userID: newUser.id,
		});
	} catch (err) {
		next(err);
	}
};

// Signin controller
exports.signin = async (req, res, next) => {
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

		// If not verified, ask client to verify via SMS
		if (!user.phone_verified) {
			return res.status(200).json({
				verificationRequired: true,
				email: user.email,
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
			name: user.name,
			email: user.email,
			dateOfBirth: user.date_of_birth,
			profilePicture: user.profile_picture,
			phoneNumber: user.phone_number,
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
			name: user.name,
			email: user.email,
			dateOfBirth: user.date_of_birth,
			profilePicture: user.profile_picture,
			phoneNumber: user.phone_number,
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

	try {
		// Check if user exists with this phone number
		const { data: user, error: findError } = await supabase
			.from('users')
			.select('id, phone_verified')
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

		if (!verificationResult.success) {
			return next(new AppError('Failed to send verification code', 500));
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

		if (user.phone_verified) {
			// Already verified; issue token
			const token = jwt.sign({ userID: user.id }, process.env.JWT_SECRET);
			return res.status(200).json({
				token,
				userID: user.id,
				name: user.name,
				email: user.email,
				dateOfBirth: user.date_of_birth,
				profilePicture: user.profile_picture,
				phoneNumber: user.phone_number,
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
				phone_verified: true,
			})
			.eq('id', user.id);

		if (updateError) throw updateError;

		// Issue token
		const token = jwt.sign({ userID: user.id }, process.env.JWT_SECRET);
		res.status(200).json({
			token,
			userID: user.id,
			name: user.name,
			email: user.email,
			dateOfBirth: user.date_of_birth,
			profilePicture: user.profile_picture,
			phoneNumber: user.phone_number,
		});
	} catch (err) {
		next(err);
	}
};
