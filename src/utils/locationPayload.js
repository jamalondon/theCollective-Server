const { cleanString, parseCoordinate } = require('./geocode');

function tryParseJson(value) {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
	try {
		return JSON.parse(trimmed);
	} catch (_) {
		return null;
	}
}

/**
 * Normalizes incoming event location payload into DB snake_case fields.
 *
 * Accepts either:
 * - legacy `location` object: { name, address, city, state, latitude, longitude }
 * - legacy `location` JSON string
 * - new fields: locationName/location_name + address/city/state/latitude/longitude
 */
function normalizeEventLocation(body) {
	const b = body || {};
	let legacy = b.location;

	// If legacy location is a JSON string, parse it.
	if (typeof legacy === 'string') {
		const parsed = tryParseJson(legacy);
		if (parsed && typeof parsed === 'object') legacy = parsed;
	}

	const fromLegacy = legacy && typeof legacy === 'object' ? legacy : {};

	const location_name =
		cleanString(fromLegacy.name) ||
		cleanString(fromLegacy.locationName) ||
		cleanString(fromLegacy.location_name) ||
		cleanString(b.locationName) ||
		cleanString(b.location_name) ||
		(typeof legacy === 'string' ? cleanString(legacy) : null);

	const address =
		cleanString(fromLegacy.address) || cleanString(b.address) || null;
	const city = cleanString(fromLegacy.city) || cleanString(b.city) || null;
	const state = cleanString(fromLegacy.state) || cleanString(b.state) || null;

	const latitude =
		parseCoordinate(fromLegacy.latitude) ?? parseCoordinate(b.latitude);
	const longitude =
		parseCoordinate(fromLegacy.longitude) ?? parseCoordinate(b.longitude);

	return {
		location_name,
		address,
		city,
		state,
		latitude,
		longitude,
	};
}

function hasAnyLocationField(loc) {
	return !!(
		loc?.location_name ||
		loc?.address ||
		loc?.city ||
		loc?.state ||
		loc?.latitude ||
		loc?.longitude
	);
}

module.exports = {
	normalizeEventLocation,
	hasAnyLocationField,
};


