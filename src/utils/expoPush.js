// src/utils/expoPush.js
const axios = require('axios');
const supabase = require('../supabase');

const EXPO_PUSH_SEND_URL = 'https://exp.host/--/api/v2/push/send';

const isProbablyExpoPushToken = (token) => {
	if (!token || typeof token !== 'string') return false;
	return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
};

const chunk = (arr, size) => {
	const out = [];
	for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
	return out;
};

const disableToken = async (expoPushToken) => {
	try {
		await supabase
			.from('push_tokens')
			.update({ disabled_at: new Date().toISOString() })
			.eq('expo_push_token', expoPushToken);
	} catch (e) {
		console.error('Failed to disable push token:', expoPushToken, e?.message);
	}
};

const fetchActiveTokens = async () => {
	const { data, error } = await supabase
		.from('push_tokens')
		.select('expo_push_token')
		.is('disabled_at', null);

	if (error) throw error;
	return (data || [])
		.map((row) => row.expo_push_token)
		.filter(isProbablyExpoPushToken);
};

// Expo HTTP API accepts up to 100 messages per request
async function sendExpoPushMessages(messages) {
	const chunks = chunk(messages, 100);

	for (const c of chunks) {
		const resp = await axios.post(EXPO_PUSH_SEND_URL, c, {
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				'Accept-Encoding': 'gzip, deflate',
			},
		});

		const tickets = resp?.data?.data || [];

		// If Expo flags a token immediately, disable it.
		for (let i = 0; i < tickets.length; i++) {
			const t = tickets[i];
			if (t?.status === 'error') {
				const original = c[i];
				const token = original?.to;
				const expoError = t?.details?.error;
				if (expoError === 'DeviceNotRegistered' && token) {
					await disableToken(token);
				}
			}
		}
	}
}

/**
 * Broadcast: new prayer request created.
 * Sends to all active tokens in push_tokens.
 */
exports.sendPrayerRequestCreatedPush = async (prayerRequestRow) => {
	const tokens = await fetchActiveTokens();
	if (!tokens.length) return { sent: 0 };

	const title = 'New prayer request';
	const body = prayerRequestRow?.anonymous
		? 'A new prayer request was posted'
		: prayerRequestRow?.title || 'A new prayer request was posted';

	const messages = tokens.map((to) => ({
		to,
		sound: 'default',
		title,
		body,
		data: { type: 'prayer_request', id: prayerRequestRow?.id },
	}));

	await sendExpoPushMessages(messages);
	return { sent: messages.length };
};

