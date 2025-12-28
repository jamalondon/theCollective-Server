const jwt = require('jsonwebtoken');
const supabase = require('../supabase');

/**
 * Helper function to authenticate user from token
 * Returns user object if valid, null otherwise
 */
const authenticateToken = (token) => {
	return new Promise((resolve) => {
		jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
			if (err) {
				return resolve(null);
			}

			const { userID } = payload;

			try {
				const { data: user, error } = await supabase
					.from('users')
					.select('*')
					.eq('id', userID)
					.single();

				if (error || !user) {
					return resolve(null);
				}

				// Remove sensitive data
				const { password, ...userWithoutPassword } = user;
				resolve(userWithoutPassword);
			} catch (error) {
				resolve(null);
			}
		});
	});
};

/**
 * Required authentication middleware.
 * Rejects request with 401 if not authenticated.
 */
const requireAuth = async (req, res, next) => {
	const { authorization } = req.headers;

	if (!authorization) {
		return res.status(401).send({ error: 'You must be logged in.' });
	}

	const token = authorization.replace('Bearer ', '');
	const user = await authenticateToken(token);

	if (!user) {
		return res.status(401).send({ error: 'You must be logged in.' });
	}

	req.user = user;
	next();
};

/**
 * Optional authentication middleware.
 * If a valid token is provided, req.user will be populated.
 * If no token or invalid token, req.user will be undefined and request continues.
 */
const optionalAuth = async (req, res, next) => {
	const { authorization } = req.headers;

	if (!authorization) {
		return next();
	}

	const token = authorization.replace('Bearer ', '');
	const user = await authenticateToken(token);

	if (user) {
		req.user = user;
	}

	next();
};

module.exports = requireAuth;
module.exports.optionalAuth = optionalAuth;
