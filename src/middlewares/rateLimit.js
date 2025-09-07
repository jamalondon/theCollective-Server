// Simple in-memory rate limiter by arbitrary key (e.g., email or IP)
// Not distributed-safe; sufficient for small deployments. For scale, use Redis.

/**
 * Factory to create a rate limit middleware keyed by a function.
 * Keeps a sliding window of timestamps per key and rejects when count exceeds max.
 * @param {{ windowMs: number, max: number, keyExtractor: (req)=>string, message?: string }} options
 */
function perKeyRateLimit(options) {
	const { windowMs, max, keyExtractor, message } = options;
	const store = new Map(); // key -> number[] timestamps (ms)

	return function rateLimitMiddleware(req, res, next) {
		try {
			const now = Date.now();
			const key = String(keyExtractor(req) || req.ip || 'global');
			const windowStart = now - windowMs;

			let timestamps = store.get(key) || [];
			// Drop entries outside window
			timestamps = timestamps.filter((t) => t >= windowStart);

			if (timestamps.length >= max) {
				return res.status(429).json({
					error: 'Too Many Requests',
					message: message || 'Too many requests. Please try again later.',
				});
			}

			timestamps.push(now);
			store.set(key, timestamps);
			next();
		} catch (err) {
			next(err);
		}
	};
}

module.exports = { perKeyRateLimit };
