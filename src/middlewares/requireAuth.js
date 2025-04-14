const jwt = require('jsonwebtoken');
const supabase = require('../supabase');

module.exports = (req, res, next) => {
	const { authorization } = req.headers;

	if (!authorization) {
		return res.status(401).send({ error: 'You must be logged in.' });
	}

	const token = authorization.replace('Bearer ', '');

	jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
		if (err) {
			return res.status(401).send({ error: 'You must be logged in.' });
		}
		const { userID } = payload;

		try {
			const { data: user, error } = await supabase
				.from('users')
				.select('*')
				.eq('id', userID)
				.single();

			if (error || !user) {
				return res.status(401).send({ error: 'User not found.' });
			}

			// Remove sensitive data before attaching to request
			const { password, ...userWithoutPassword } = user;
			req.user = userWithoutPassword;
			next();
		} catch (error) {
			return res.status(401).send({ error: 'Authentication failed.' });
		}
	});
};
