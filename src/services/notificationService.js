const supabase = require('../supabase');
const { sendExpoPushMessages } = require('../utils/expoPush');

/**
 * Core notification service for handling all push notifications
 * Supports event creation, likes, and comments for both prayer requests and events
 */

// Notification type constants
const NOTIFICATION_TYPES = {
	EVENT_CREATED: 'event_created',
	PRAYER_REQUEST_LIKE: 'prayer_request_like',
	PRAYER_REQUEST_COMMENT: 'prayer_request_comment',
	EVENT_LIKE: 'event_like',
	EVENT_COMMENT: 'event_comment',
};

/**
 * Build notification message based on type and context
 * @param {string} type - Notification type
 * @param {Object} context - Context data for building the message
 * @returns {Object} Notification message object
 */
function buildNotificationMessage(type, context) {
	const { actor, resource, action } = context;

	switch (type) {
		case NOTIFICATION_TYPES.EVENT_CREATED:
			return {
				title: `${actor.full_name} created a new event`,
				body: resource.title,
				data: {
					route: `/event/${resource.id}`,
					type: 'event',
					id: resource.id,
					actorId: actor.id,
				},
			};

		case NOTIFICATION_TYPES.PRAYER_REQUEST_LIKE:
			return {
				title: `${actor.full_name} liked your prayer request`,
				body: resource.anonymous
					? 'Someone liked your prayer request'
					: resource.title,
				data: {
					route: `/prayer-request/${resource.id}`,
					type: 'prayer_request',
					id: resource.id,
					actorId: actor.id,
					actionId: action?.id,
				},
			};

		case NOTIFICATION_TYPES.PRAYER_REQUEST_COMMENT:
			return {
				title: `${actor.full_name} commented on your prayer request`,
				body:
					action.text.length > 50
						? `${action.text.substring(0, 50)}...`
						: action.text,
				data: {
					route: `/prayer-request/${resource.id}`,
					type: 'prayer_request',
					id: resource.id,
					actorId: actor.id,
					actionId: action.id,
				},
			};

		case NOTIFICATION_TYPES.EVENT_LIKE:
			return {
				title: `${actor.full_name} liked your event`,
				body: resource.title,
				data: {
					route: `/event/${resource.id}`,
					type: 'event',
					id: resource.id,
					actorId: actor.id,
					actionId: action?.id,
				},
			};

		case NOTIFICATION_TYPES.EVENT_COMMENT:
			return {
				title: `${actor.full_name} commented on your event`,
				body:
					action.text.length > 50
						? `${action.text.substring(0, 50)}...`
						: action.text,
				data: {
					route: `/event/${resource.id}`,
					type: 'event',
					id: resource.id,
					actorId: actor.id,
					actionId: action.id,
				},
			};

		default:
			throw new Error(`Unknown notification type: ${type}`);
	}
}

/**
 * Get recipients for a notification based on type and context
 * @param {string} type - Notification type
 * @param {Object} context - Context data
 * @returns {Array} Array of user IDs who should receive the notification
 */
async function getNotificationRecipients(type, context) {
	const { actor, resource } = context;
	let recipients = [];

	try {
		switch (type) {
			case NOTIFICATION_TYPES.EVENT_CREATED:
				// Get followers of the event creator
				const { data: followers, error: followersError } = await supabase
					.from('user_followers')
					.select('follower_id')
					.eq('following_id', actor.id);

				if (followersError) throw followersError;
				recipients = followers.map((f) => f.follower_id);
				break;

			case NOTIFICATION_TYPES.PRAYER_REQUEST_LIKE:
			case NOTIFICATION_TYPES.PRAYER_REQUEST_COMMENT:
				// Notify the prayer request owner
				if (resource.owner_id && resource.owner_id !== actor.id) {
					recipients = [resource.owner_id];
				}
				break;

			case NOTIFICATION_TYPES.EVENT_LIKE:
			case NOTIFICATION_TYPES.EVENT_COMMENT:
				// Notify the event owner
				if (resource.owner_id && resource.owner_id !== actor.id) {
					recipients = [resource.owner_id];
				}
				break;

			default:
				console.warn(
					`Unknown notification type for recipient selection: ${type}`
				);
		}

		// Remove duplicates and filter out the actor
		recipients = [...new Set(recipients)].filter((id) => id !== actor.id);

		return recipients;
	} catch (error) {
		console.error('Error getting notification recipients:', error);
		return [];
	}
}

/**
 * Filter recipients based on their notification preferences
 * @param {Array} userIds - Array of user IDs
 * @param {string} type - Notification type
 * @returns {Array} Filtered array of user IDs
 */
async function filterRecipientsByPreferences(userIds, type) {
	if (!userIds.length) return [];

	try {
		// Determine which preference category to check
		let categoryColumn = 'notifications_enabled';

		switch (type) {
			case NOTIFICATION_TYPES.EVENT_CREATED:
				categoryColumn = 'event_notifications';
				break;
			case NOTIFICATION_TYPES.PRAYER_REQUEST_LIKE:
			case NOTIFICATION_TYPES.PRAYER_REQUEST_COMMENT:
				categoryColumn = 'prayer_notifications';
				break;
			case NOTIFICATION_TYPES.EVENT_LIKE:
			case NOTIFICATION_TYPES.EVENT_COMMENT:
				categoryColumn = 'social_notifications';
				break;
		}

		// Get users with notifications enabled for this category
		const { data: preferences, error } = await supabase
			.from('user_notification_preferences')
			.select('user_id')
			.in('user_id', userIds)
			.eq('notifications_enabled', true)
			.eq(categoryColumn, true);

		if (error) {
			console.error('Error filtering recipients by preferences:', error);
			return userIds; // Return all recipients if preference check fails
		}

		return preferences.map((p) => p.user_id);
	} catch (error) {
		console.error('Error in filterRecipientsByPreferences:', error);
		return userIds; // Return all recipients if filtering fails
	}
}

/**
 * Get active push tokens for users
 * @param {Array} userIds - Array of user IDs
 * @returns {Array} Array of push token objects
 */
async function getActivePushTokens(userIds) {
	if (!userIds.length) return [];

	try {
		const { data: tokens, error } = await supabase
			.from('push_tokens')
			.select('user_id, expo_push_token, platform')
			.in('user_id', userIds)
			.is('disabled_at', null)
			.not('expo_push_token', 'is', null);

		if (error) throw error;

		// Deduplicate tokens (in case user has multiple devices, we'll send to all)
		const uniqueTokens = [];
		const seenTokens = new Set();

		for (const token of tokens) {
			if (!seenTokens.has(token.expo_push_token)) {
				seenTokens.add(token.expo_push_token);
				uniqueTokens.push(token);
			}
		}

		return uniqueTokens;
	} catch (error) {
		console.error('Error getting active push tokens:', error);
		return [];
	}
}

/**
 * Send notification to recipients
 * @param {string} type - Notification type
 * @param {Object} context - Notification context
 * @returns {Object} Result object with sent count and any errors
 */
async function sendNotification(type, context) {
	try {
		console.log(`Sending notification of type: ${type}`);

		// Get recipients
		const recipients = await getNotificationRecipients(type, context);
		if (!recipients.length) {
			console.log('No recipients found for notification');
			return { sent: 0, recipients: 0 };
		}

		console.log(`Found ${recipients.length} potential recipients`);

		// Filter by preferences
		const filteredRecipients = await filterRecipientsByPreferences(
			recipients,
			type
		);
		if (!filteredRecipients.length) {
			console.log('No recipients after preference filtering');
			return { sent: 0, recipients: recipients.length, filtered: 0 };
		}

		console.log(
			`${filteredRecipients.length} recipients after preference filtering`
		);

		// Get push tokens
		const tokens = await getActivePushTokens(filteredRecipients);
		if (!tokens.length) {
			console.log('No active push tokens found');
			return {
				sent: 0,
				recipients: recipients.length,
				filtered: filteredRecipients.length,
				tokens: 0,
			};
		}

		console.log(`Found ${tokens.length} active push tokens`);

		// Build notification message
		const messageTemplate = buildNotificationMessage(type, context);

		// Create messages for each token
		const messages = tokens.map((token) => ({
			to: token.expo_push_token,
			sound: 'default',
			title: messageTemplate.title,
			body: messageTemplate.body,
			data: messageTemplate.data,
			badge: 1,
		}));

		// Send messages
		await sendExpoPushMessages(messages);

		console.log(`Successfully sent ${messages.length} notifications`);

		return {
			sent: messages.length,
			recipients: recipients.length,
			filtered: filteredRecipients.length,
			tokens: tokens.length,
		};
	} catch (error) {
		console.error('Error sending notification:', error);
		return {
			sent: 0,
			error: error.message,
		};
	}
}

/**
 * Send event created notification to followers
 * @param {Object} event - Event object
 * @param {Object} creator - Creator user object
 */
async function sendEventCreatedNotification(event, creator) {
	return sendNotification(NOTIFICATION_TYPES.EVENT_CREATED, {
		actor: creator,
		resource: event,
	});
}

/**
 * Send prayer request like notification
 * @param {Object} prayerRequest - Prayer request object
 * @param {Object} like - Like object
 * @param {Object} actor - User who liked
 */
async function sendPrayerRequestLikeNotification(prayerRequest, like, actor) {
	return sendNotification(NOTIFICATION_TYPES.PRAYER_REQUEST_LIKE, {
		actor: actor,
		resource: prayerRequest,
		action: like,
	});
}

/**
 * Send prayer request comment notification
 * @param {Object} prayerRequest - Prayer request object
 * @param {Object} comment - Comment object
 * @param {Object} actor - User who commented
 */
async function sendPrayerRequestCommentNotification(
	prayerRequest,
	comment,
	actor
) {
	return sendNotification(NOTIFICATION_TYPES.PRAYER_REQUEST_COMMENT, {
		actor: actor,
		resource: prayerRequest,
		action: comment,
	});
}

/**
 * Send event like notification
 * @param {Object} event - Event object
 * @param {Object} like - Like object
 * @param {Object} actor - User who liked
 */
async function sendEventLikeNotification(event, like, actor) {
	return sendNotification(NOTIFICATION_TYPES.EVENT_LIKE, {
		actor: actor,
		resource: event,
		action: like,
	});
}

/**
 * Send event comment notification
 * @param {Object} event - Event object
 * @param {Object} comment - Comment object
 * @param {Object} actor - User who commented
 */
async function sendEventCommentNotification(event, comment, actor) {
	return sendNotification(NOTIFICATION_TYPES.EVENT_COMMENT, {
		actor: actor,
		resource: event,
		action: comment,
	});
}

module.exports = {
	NOTIFICATION_TYPES,
	sendEventCreatedNotification,
	sendPrayerRequestLikeNotification,
	sendPrayerRequestCommentNotification,
	sendEventLikeNotification,
	sendEventCommentNotification,
	// Export internal functions for testing
	buildNotificationMessage,
	getNotificationRecipients,
	filterRecipientsByPreferences,
	getActivePushTokens,
};
