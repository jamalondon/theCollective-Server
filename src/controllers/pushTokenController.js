// src/controllers/pushTokenController.js
const supabase = require('../supabase');

const isProbablyExpoPushToken = (token) => {
	if (!token || typeof token !== 'string') return false;
	// Common formats: ExponentPushToken[...], ExpoPushToken[...]
	return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
};

/*
  Upsert Expo push token for authenticated user
  POST /API/v1/users/push-token
  Body: { expoPushToken: string, platform?: 'ios'|'android', deviceId?: string }
*/
exports.upsertPushToken = async (req, res) => {
	try {
		const user = req.user;
		const { expoPushToken, platform, deviceId } = req.body || {};

		if (!expoPushToken) {
			return res.status(400).json({ message: 'expoPushToken is required' });
		}

		if (!isProbablyExpoPushToken(expoPushToken)) {
			return res.status(400).json({ message: 'Invalid Expo push token format' });
		}

		const record = {
			user_id: user.id,
			expo_push_token: expoPushToken,
			platform: platform || null,
			device_id: deviceId || null,
			last_seen_at: new Date().toISOString(),
			disabled_at: null,
		};

		// Upsert by token so same device doesn't create duplicates
		const { data, error } = await supabase
			.from('push_tokens')
			.upsert(record, { onConflict: 'expo_push_token' })
			.select()
			.single();

		if (error) {
			console.error('Error upserting push token:', error);
			return res.status(500).json({ message: error.message });
		}

		return res.status(200).json({ success: true, data });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: err.message });
	}
};

