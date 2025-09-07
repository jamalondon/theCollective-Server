const supabase = require('../supabase');

// Deletes expired verification codes to reduce stale data and prevent reuse
async function clearExpiredVerificationCodes() {
	const nowIso = new Date().toISOString();
	try {
		const { error } = await supabase
			.from('users')
			.update({ verification_code: null, verification_expires_at: null })
			.lt('verification_expires_at', nowIso)
			.neq('verification_expires_at', null);

		if (error) throw error;
	} catch (err) {
		console.error('Failed to clear expired verification codes:', err.message);
	}
}

module.exports = { clearExpiredVerificationCodes };
