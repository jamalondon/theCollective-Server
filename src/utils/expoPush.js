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

/**
 * Disable a push token by marking it with disabled_at timestamp
 * @param {string} expoPushToken - The token to disable
 */
const disableToken = async (expoPushToken) => {
	try {
		const { error } = await supabase
			.from('push_tokens')
			.update({ disabled_at: new Date().toISOString() })
			.eq('expo_push_token', expoPushToken);

		if (error) {
			console.error('Database error disabling push token:', expoPushToken, error.message);
		} else {
			console.log('Successfully disabled push token:', expoPushToken);
		}
	} catch (e) {
		console.error('Failed to disable push token:', expoPushToken, e?.message);
	}
};

/**
 * Fetch all active push tokens from the database
 * @returns {Array} Array of valid Expo push tokens
 */
const fetchActiveTokens = async () => {
	try {
		const { data, error } = await supabase
			.from('push_tokens')
			.select('expo_push_token, user_id, platform')
			.is('disabled_at', null)
			.not('expo_push_token', 'is', null);

		if (error) throw error;
		
		const validTokens = (data || [])
			.filter(row => isProbablyExpoPushToken(row.expo_push_token))
			.map(row => row.expo_push_token);

		console.log(`Found ${validTokens.length} active push tokens`);
		return validTokens;
	} catch (error) {
		console.error('Error fetching active tokens:', error);
		return [];
	}
};

/**
 * Enhanced Expo push message sending with retry logic and comprehensive error handling
 * @param {Array} messages - Array of Expo push message objects
 * @param {Object} options - Options for sending
 * @returns {Object} Result object with success/failure counts and details
 */
async function sendExpoPushMessages(messages, options = {}) {
	const { 
		maxRetries = 3, 
		retryDelay = 1000,
		logResults = true 
	} = options;
	
	if (!messages || !messages.length) {
		console.log('No messages to send');
		return { sent: 0, failed: 0, errors: [] };
	}

	console.log(`Sending ${messages.length} push notifications...`);
	
	const chunks = chunk(messages, 100);
	let totalSent = 0;
	let totalFailed = 0;
	const errors = [];

	for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
		const c = chunks[chunkIndex];
		let attempt = 0;
		let success = false;

		while (attempt < maxRetries && !success) {
			try {
				attempt++;
				
				const resp = await axios.post(EXPO_PUSH_SEND_URL, c, {
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json',
						'Accept-Encoding': 'gzip, deflate',
					},
					timeout: 30000 // 30 second timeout
				});

				const tickets = resp?.data?.data || [];
				
				if (logResults) {
					console.log(`Chunk ${chunkIndex + 1}/${chunks.length}: Received ${tickets.length} tickets`);
				}

				// Process tickets and handle errors
				let chunkSent = 0;
				let chunkFailed = 0;

				for (let i = 0; i < tickets.length; i++) {
					const ticket = tickets[i];
					const originalMessage = c[i];
					const token = originalMessage?.to;

					if (ticket?.status === 'ok') {
						chunkSent++;
					} else if (ticket?.status === 'error') {
						chunkFailed++;
						const expoError = ticket?.details?.error;
						const errorMessage = ticket?.details?.message || 'Unknown error';

						// Log the error
						console.error(`Push notification error for token ${token}: ${expoError} - ${errorMessage}`);
						errors.push({
							token,
							error: expoError,
							message: errorMessage,
							originalMessage: originalMessage?.title || 'Unknown'
						});

						// Handle specific error types
						if (expoError === 'DeviceNotRegistered') {
							console.log(`Disabling invalid token: ${token}`);
							await disableToken(token);
						} else if (expoError === 'InvalidCredentials') {
							console.error('Invalid Expo credentials - check configuration');
						} else if (expoError === 'MessageTooBig') {
							console.error('Message too big:', originalMessage);
						}
					}
				}

				totalSent += chunkSent;
				totalFailed += chunkFailed;
				success = true;

				if (logResults) {
					console.log(`Chunk ${chunkIndex + 1} results: ${chunkSent} sent, ${chunkFailed} failed`);
				}

			} catch (error) {
				console.error(`Attempt ${attempt}/${maxRetries} failed for chunk ${chunkIndex + 1}:`, error.message);
				
				if (attempt === maxRetries) {
					// Final attempt failed
					totalFailed += c.length;
					errors.push({
						chunk: chunkIndex + 1,
						error: 'NetworkError',
						message: error.message,
						messagesAffected: c.length
					});
				} else {
					// Wait before retry
					await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
				}
			}
		}
	}

	const result = {
		sent: totalSent,
		failed: totalFailed,
		total: messages.length,
		errors: errors.length > 0 ? errors : undefined
	};

	if (logResults) {
		console.log(`Push notification summary: ${totalSent}/${messages.length} sent successfully`);
		if (totalFailed > 0) {
			console.log(`${totalFailed} notifications failed`);
		}
	}

	return result;
}

/**
 * Get active push tokens for specific users
 * @param {Array} userIds - Array of user IDs
 * @returns {Array} Array of token objects with user info
 */
const fetchActiveTokensForUsers = async (userIds) => {
	if (!userIds || !userIds.length) return [];

	try {
		const { data, error } = await supabase
			.from('push_tokens')
			.select('expo_push_token, user_id, platform')
			.in('user_id', userIds)
			.is('disabled_at', null)
			.not('expo_push_token', 'is', null);

		if (error) throw error;
		
		const validTokens = (data || [])
			.filter(row => isProbablyExpoPushToken(row.expo_push_token));

		console.log(`Found ${validTokens.length} active push tokens for ${userIds.length} users`);
		return validTokens;
	} catch (error) {
		console.error('Error fetching active tokens for users:', error);
		return [];
	}
};

/**
 * Validate Expo push message format
 * @param {Object} message - Message object to validate
 * @returns {boolean} True if valid
 */
const validatePushMessage = (message) => {
	if (!message || typeof message !== 'object') return false;
	if (!message.to || !isProbablyExpoPushToken(message.to)) return false;
	if (!message.title && !message.body) return false;
	return true;
};

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
		data: { 
			route: `/prayer-request/${prayerRequestRow?.id}`,
			type: 'prayer_request', 
			id: prayerRequestRow?.id 
		},
		badge: 1,
	}));

	const result = await sendExpoPushMessages(messages);
	return result;
};

// Export enhanced functions
module.exports = {
	sendExpoPushMessages,
	fetchActiveTokens,
	fetchActiveTokensForUsers,
	validatePushMessage,
	disableToken,
	isProbablyExpoPushToken,
	// Legacy export for backward compatibility
	sendPrayerRequestCreatedPush: exports.sendPrayerRequestCreatedPush
};

