const GoogleAPI = require('../APIs/GoogleAPI');

function getGoogleMapsApiKey() {
	return (
		process.env.GOOGLE_MAPS_API_KEY ||
		process.env.GEMINI_API_KEY ||
		process.env.GOOGLE_API_KEY
	);
}

function cleanString(value) {
	if (typeof value !== 'string') return value;
	const trimmed = value.trim();
	return trimmed.length ? trimmed : null;
}

function parseCoordinate(value) {
	if (value === null || value === undefined || value === '') return null;
	const num = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(num) ? num : null;
}

function pickAddressComponent(components, type) {
	if (!Array.isArray(components)) return null;
	const found = components.find((c) => Array.isArray(c?.types) && c.types.includes(type));
	return found?.long_name || found?.short_name || null;
}

/**
 * Calls Google Geocoding API and returns normalized location fields.
 * Soft-fails (returns { ok: false }) if request fails or no results.
 *
 * @param {Object} params
 * @param {string|null} params.address
 * @param {string|null} params.city
 * @param {string|null} params.state
 * @returns {Promise<{ok: true, data: {address: string|null, city: string|null, state: string|null, latitude: number|null, longitude: number|null}} | {ok: false, error: string}>}
 */
async function geocodeAddress({ address, city, state }) {
	const apiKey = getGoogleMapsApiKey();
	if (!apiKey) {
		return { ok: false, error: 'Missing GOOGLE_MAPS_API_KEY' };
	}

	const addr = cleanString(address);
	const c = cleanString(city);
	const s = cleanString(state);

	const query = [addr, c, s].filter(Boolean).join(', ');
	if (!query) {
		return { ok: false, error: 'No address query provided' };
	}

	try {
		const resp = await GoogleAPI.get('/json', {
			params: {
				address: query,
				key: apiKey,
			},
		});

		const payload = resp?.data;
		const first = payload?.results?.[0];
		if (!first) {
			return { ok: false, error: payload?.status || 'No results' };
		}

		const lat = parseCoordinate(first?.geometry?.location?.lat);
		const lng = parseCoordinate(first?.geometry?.location?.lng);
		const formatted = cleanString(first?.formatted_address) || addr;

		// City: locality is best; fall back to postal_town.
		const components = first?.address_components || [];
		const parsedCity =
			pickAddressComponent(components, 'locality') ||
			pickAddressComponent(components, 'postal_town') ||
			c;
		const parsedState =
			pickAddressComponent(components, 'administrative_area_level_1') || s;

		return {
			ok: true,
			data: {
				address: formatted,
				city: parsedCity,
				state: parsedState,
				latitude: lat,
				longitude: lng,
			},
		};
	} catch (e) {
		return { ok: false, error: e?.message || 'Geocoding request failed' };
	}
}

module.exports = {
	cleanString,
	parseCoordinate,
	geocodeAddress,
};


