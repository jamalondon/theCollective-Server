const supabase = require('../supabase');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * Get user's notification preferences
 * GET /API/v1/users/notification-preferences
 */
exports.getNotificationPreferences = catchAsync(async (req, res, next) => {
	const userId = req.user.id;

	// Try to get existing preferences
	let { data: preferences, error } = await supabase
		.from('user_notification_preferences')
		.select('*')
		.eq('user_id', userId)
		.single();

	// If no preferences exist, create default ones
	if (error && error.code === 'PGRST116') {
		const defaultPreferences = {
			user_id: userId,
			notifications_enabled: true,
			event_notifications: true,
			prayer_notifications: true,
			social_notifications: true,
		};

		const { data: newPreferences, error: insertError } = await supabase
			.from('user_notification_preferences')
			.insert([defaultPreferences])
			.select()
			.single();

		if (insertError) {
			console.error(
				'Error creating default notification preferences:',
				insertError
			);
			return next(
				new AppError('Failed to create notification preferences', 500)
			);
		}

		preferences = newPreferences;
	} else if (error) {
		console.error('Error fetching notification preferences:', error);
		return next(new AppError('Failed to fetch notification preferences', 500));
	}

	res.status(200).json({
		status: 'success',
		data: {
			preferences: {
				notifications_enabled: preferences.notifications_enabled,
				event_notifications: preferences.event_notifications,
				prayer_notifications: preferences.prayer_notifications,
				social_notifications: preferences.social_notifications,
				updated_at: preferences.updated_at,
			},
		},
	});
});

/**
 * Update user's notification preferences
 * PUT /API/v1/users/notification-preferences
 */
exports.updateNotificationPreferences = catchAsync(async (req, res, next) => {
	const userId = req.user.id;
	const {
		notifications_enabled,
		event_notifications,
		prayer_notifications,
		social_notifications,
	} = req.body;

	// Validate input
	const validBooleanFields = {
		notifications_enabled,
		event_notifications,
		prayer_notifications,
		social_notifications,
	};

	const updates = {};
	for (const [key, value] of Object.entries(validBooleanFields)) {
		if (value !== undefined) {
			if (typeof value !== 'boolean') {
				return next(new AppError(`${key} must be a boolean value`, 400));
			}
			updates[key] = value;
		}
	}

	if (Object.keys(updates).length === 0) {
		return next(new AppError('No valid preferences provided to update', 400));
	}

	// If disabling master notifications, disable all categories
	if (updates.notifications_enabled === false) {
		updates.event_notifications = false;
		updates.prayer_notifications = false;
		updates.social_notifications = false;
	}

	try {
		// Try to update existing preferences
		const { data: updatedPreferences, error: updateError } = await supabase
			.from('user_notification_preferences')
			.update(updates)
			.eq('user_id', userId)
			.select()
			.single();

		if (updateError && updateError.code === 'PGRST116') {
			// No existing preferences, create new ones
			const newPreferences = {
				user_id: userId,
				notifications_enabled: updates.notifications_enabled ?? true,
				event_notifications: updates.event_notifications ?? true,
				prayer_notifications: updates.prayer_notifications ?? true,
				social_notifications: updates.social_notifications ?? true,
			};

			const { data: insertedPreferences, error: insertError } = await supabase
				.from('user_notification_preferences')
				.insert([newPreferences])
				.select()
				.single();

			if (insertError) {
				console.error('Error creating notification preferences:', insertError);
				return next(
					new AppError('Failed to create notification preferences', 500)
				);
			}

			return res.status(201).json({
				status: 'success',
				message: 'Notification preferences created successfully',
				data: {
					preferences: {
						notifications_enabled: insertedPreferences.notifications_enabled,
						event_notifications: insertedPreferences.event_notifications,
						prayer_notifications: insertedPreferences.prayer_notifications,
						social_notifications: insertedPreferences.social_notifications,
						updated_at: insertedPreferences.updated_at,
					},
				},
			});
		} else if (updateError) {
			console.error('Error updating notification preferences:', updateError);
			return next(
				new AppError('Failed to update notification preferences', 500)
			);
		}

		res.status(200).json({
			status: 'success',
			message: 'Notification preferences updated successfully',
			data: {
				preferences: {
					notifications_enabled: updatedPreferences.notifications_enabled,
					event_notifications: updatedPreferences.event_notifications,
					prayer_notifications: updatedPreferences.prayer_notifications,
					social_notifications: updatedPreferences.social_notifications,
					updated_at: updatedPreferences.updated_at,
				},
			},
		});
	} catch (err) {
		console.error('Error in updateNotificationPreferences:', err);
		return next(new AppError('Failed to update notification preferences', 500));
	}
});

/**
 * Reset notification preferences to defaults
 * POST /API/v1/users/notification-preferences/reset
 */
exports.resetNotificationPreferences = catchAsync(async (req, res, next) => {
	const userId = req.user.id;

	const defaultPreferences = {
		notifications_enabled: true,
		event_notifications: true,
		prayer_notifications: true,
		social_notifications: true,
	};

	try {
		const { data: preferences, error } = await supabase
			.from('user_notification_preferences')
			.upsert({
				user_id: userId,
				...defaultPreferences,
			})
			.select()
			.single();

		if (error) {
			console.error('Error resetting notification preferences:', error);
			return next(
				new AppError('Failed to reset notification preferences', 500)
			);
		}

		res.status(200).json({
			status: 'success',
			message: 'Notification preferences reset to defaults',
			data: {
				preferences: {
					notifications_enabled: preferences.notifications_enabled,
					event_notifications: preferences.event_notifications,
					prayer_notifications: preferences.prayer_notifications,
					social_notifications: preferences.social_notifications,
					updated_at: preferences.updated_at,
				},
			},
		});
	} catch (err) {
		console.error('Error in resetNotificationPreferences:', err);
		return next(new AppError('Failed to reset notification preferences', 500));
	}
});

/**
 * Create default notification preferences for a new user
 * This is typically called during user registration
 */
exports.createDefaultPreferences = async (userId) => {
	try {
		const defaultPreferences = {
			user_id: userId,
			notifications_enabled: true,
			event_notifications: true,
			prayer_notifications: true,
			social_notifications: true,
		};

		const { data, error } = await supabase
			.from('user_notification_preferences')
			.insert([defaultPreferences])
			.select()
			.single();

		if (error) {
			console.error('Error creating default notification preferences:', error);
			return null;
		}

		return data;
	} catch (err) {
		console.error('Error in createDefaultPreferences:', err);
		return null;
	}
};
