const errorHandler = (err, req, res, next) => {
	console.error(err.stack);

	// Handle specific error types
	if (err.name === 'ValidationError') {
		return res.status(400).json({
			error: 'Validation Error',
			message: err.message,
		});
	}

	if (err.name === 'UnauthorizedError') {
		return res.status(401).json({
			error: 'Unauthorized',
			message: 'Invalid or expired token',
		});
	}

	if (err.name === 'NotFoundError') {
		return res.status(404).json({
			error: 'Not Found',
			message: err.message,
		});
	}

	// Handle JWT errors
	if (err.name === 'JsonWebTokenError') {
		return res.status(401).json({
			error: 'Invalid Token',
			message: 'The authentication token is invalid',
		});
	}

	if (err.name === 'TokenExpiredError') {
		return res.status(401).json({
			error: 'Token Expired',
			message: 'The authentication token has expired',
		});
	}

	// Handle AppError instances
	if (err.statusCode) {
		return res.status(err.statusCode).json({
			error: err.name || 'Error',
			message: err.message,
		});
	}

	// Default error
	return res.status(500).json({
		error: 'Server Error',
		message:
			process.env.NODE_ENV === 'development'
				? err.message
				: 'An unexpected error occurred',
	});
};

module.exports = errorHandler;
