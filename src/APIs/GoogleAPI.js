const axios = require('axios');

/**
 * Google Maps Geocoding API client.
 *
 * NOTE: Geocoding API expects the API key as a query param (`key=...`), not
 * an `x-goog-api-key` header. The axios instance is used by `src/utils/geocode.js`.
 *
 * Env vars:
 * - GOOGLE_MAPS_API_KEY (preferred)
 * - GEMINI_API_KEY (fallback for existing setups)
 */
module.exports = axios.create({
	baseURL: 'https://maps.googleapis.com/maps/api/geocode',
	timeout: 10000, // 10 second timeout
	headers: {
		'Content-Type': 'application/json',
	},
});
