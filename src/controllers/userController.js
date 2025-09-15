const { createClient } = require('@supabase/supabase-js');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_SERVICE_KEY
);

/**
 * Upload profile picture for authenticated user
 * Handles file upload to Supabase storage and updates user record
 */
exports.uploadProfilePicture = catchAsync(async (req, res, next) => {
	if (!req.file) {
		return next(new AppError('No file uploaded', 400));
	}

	const timestamp = new Date().getTime();
	const fileExtension = req.file.originalname.split('.').pop();
	const fileName = `profile-pictures/${req.user.id}-${timestamp}.${fileExtension}`;

	// Upload file to Supabase Storage
	const { data, error } = await supabase.storage
		.from('user-profileimg')
		.upload(fileName, req.file.buffer, {
			contentType: req.file.mimetype,
			upsert: true,
		});

	if (error) {
		throw error;
	}

	// Get the public URL
	const {
		data: { publicUrl },
	} = supabase.storage.from('user-profileimg').getPublicUrl(fileName);

	// Update user in Supabase
	const { error: updateError } = await supabase
		.from('users')
		.update({ profile_picture: publicUrl })
		.eq('id', req.user.id);

	if (updateError) {
		throw updateError;
	}

	res.status(200).json({
		message: 'Profile picture uploaded successfully',
		profilePictureUrl: publicUrl,
	});
});

/**
 * Search for users by name
 * Returns partial user information for search results
 */
exports.searchUsers = catchAsync(async (req, res, next) => {
	const { query } = req.query;

	if (!query) {
		return next(new AppError('Search query is required', 400));
	}

	const { data: users, error } = await supabase
		.from('users')
		.select('id, name, profile_picture')
		.ilike('name', `${query}%`)
		.limit(20);

	if (error) throw error;

	res.status(200).json({
		success: true,
		data: users,
	});
});

/**
 * Get prayer requests created by the authenticated user
 * Includes request details and current status
 */
exports.getUserPrayerRequests = catchAsync(async (req, res, next) => {
	const { page = 1, limit = 10 } = req.query;
	const offset = (page - 1) * limit;

	const { data: prayerRequests, error } = await supabase
		.from('prayer_requests')
		.select(
			`
			id,
			title,
			text,
			created_at,
			anonymous,
			owner,
			photos
		`
		)
		.eq('owner->>id', req.user.id)
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) throw error;

	// Get total count for pagination
	const { count, error: countError } = await supabase
		.from('prayer_requests')
		.select('*', { count: 'exact', head: true })
		.eq('owner->>id', req.user.id);

	if (countError) throw countError;

	res.status(200).json({
		success: true,
		data: prayerRequests,
		pagination: {
			currentPage: parseInt(page),
			totalPages: Math.ceil(count / limit),
			totalCount: count,
			hasNext: page * limit < count,
			hasPrev: page > 1,
		},
	});
});

/**
 * Get prayer requests the user has commented on
 * Includes the prayer request details and user's comments
 */
exports.getUserPrayerComments = catchAsync(async (req, res, next) => {
	const { page = 1, limit = 10 } = req.query;
	const offset = (page - 1) * limit;

	// Get prayer requests where user has commented
	// Since comments are stored as JSON arrays within prayer_requests,
	// we need to filter where the comments array contains the user's ID
	const { data: commentedRequests, error } = await supabase
		.from('prayer_requests')
		.select(
			`
			id,
			title,
			text,
			created_at,
			owner,
			comments,
			anonymous
		`
		)
		.contains('comments', [{ user_id: req.user.id }])
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) throw error;

	// Filter and format the results to only show user's comments
	const formattedResults =
		commentedRequests?.map((request) => ({
			...request,
			userComments:
				request.comments?.filter(
					(comment) => comment.user_id === req.user.id
				) || [],
		})) || [];

	// Get total count for pagination
	const { count, error: countError } = await supabase
		.from('prayer_requests')
		.select('*', { count: 'exact', head: true })
		.contains('comments', [{ user_id: req.user.id }]);

	if (countError) throw countError;

	res.status(200).json({
		success: true,
		data: formattedResults,
		pagination: {
			currentPage: parseInt(page),
			totalPages: Math.ceil((count || 0) / limit),
			totalCount: count || 0,
			hasNext: page * limit < (count || 0),
			hasPrev: page > 1,
		},
	});
});

/**
 * Get events the user has attended or registered for
 * Includes event details and attendance status
 */
exports.getUserEvents = catchAsync(async (req, res, next) => {
	const { page = 1, limit = 10, status = 'all' } = req.query;
	const offset = (page - 1) * limit;

	let query = supabase
		.from('event_attendees')
		.select(
			`
			id,
			attendance_status,
			registered_at,
			events (
				id,
				title,
				description,
				event_date,
				start_time,
				end_time,
				location,
				max_attendees,
				status
			)
		`
		)
		.eq('user_id', req.user.id)
		.order('registered_at', { ascending: false });

	// Filter by attendance status if specified
	if (status !== 'all') {
		query = query.eq('attendance_status', status);
	}

	const { data: userEvents, error } = await query.range(
		offset,
		offset + limit - 1
	);

	if (error) throw error;

	// Get total count for pagination
	let countQuery = supabase
		.from('event_attendees')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', req.user.id);

	if (status !== 'all') {
		countQuery = countQuery.eq('attendance_status', status);
	}

	const { count, error: countError } = await countQuery;

	if (countError) throw countError;

	res.status(200).json({
		success: true,
		data: userEvents,
		pagination: {
			currentPage: parseInt(page),
			totalPages: Math.ceil(count / limit),
			totalCount: count,
			hasNext: page * limit < count,
			hasPrev: page > 1,
		},
	});
});

/**
 * Get sermon discussions the user has participated in
 * Includes sermon details and user's discussion contributions
 */
exports.getUserSermonDiscussions = catchAsync(async (req, res, next) => {
	const { page = 1, limit = 10 } = req.query;
	const offset = (page - 1) * limit;

	// Get sermon discussions where user has participated
	const { data: userDiscussions, error } = await supabase
		.from('sermon_discussion_comments')
		.select(
			`
			id,
			comment,
			created_at,
			sermon_discussions (
				id,
				question,
				created_at,
				sermon_series (
					id,
					title,
					description,
					series_image
				)
			)
		`
		)
		.eq('user_id', req.user.id)
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) throw error;

	// Get total count for pagination
	const { count, error: countError } = await supabase
		.from('sermon_discussion_comments')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', req.user.id);

	if (countError) throw countError;

	res.status(200).json({
		success: true,
		data: userDiscussions,
		pagination: {
			currentPage: parseInt(page),
			totalPages: Math.ceil(count / limit),
			totalCount: count,
			hasNext: page * limit < count,
			hasPrev: page > 1,
		},
	});
});

/**
 * Get comprehensive user profile information
 * Includes basic profile data and activity summary
 */
exports.getUserProfile = catchAsync(async (req, res, next) => {
	const userId = req.user.id;

	// Get user basic information
	const { data: user, error: userError } = await supabase
		.from('users')
		.select('id, username, name, profile_picture, date_of_birth, created_at')
		.eq('id', userId)
		.single();

	if (userError) throw userError;

	// Get activity counts in parallel
	const [
		{ count: prayerRequestCount },
		{ count: prayerCommentCount },
		{ count: eventCount },
		{ count: sermonDiscussionCount },
	] = await Promise.all([
		supabase
			.from('prayer_requests')
			.select('*', { count: 'exact', head: true })
			.eq('owner->>id', userId),
		supabase
			.from('prayer_requests')
			.select('*', { count: 'exact', head: true })
			.contains('comments', [{ user_id: userId }]),
		supabase
			.from('event_attendees')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', userId),
		supabase
			.from('sermon_discussion_comments')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', userId),
	]);

	res.status(200).json({
		success: true,
		data: {
			user,
			activitySummary: {
				prayerRequestsCreated: prayerRequestCount || 0,
				prayerRequestsCommented: prayerCommentCount || 0,
				eventsAttended: eventCount || 0,
				sermonDiscussionsParticipated: sermonDiscussionCount || 0,
			},
		},
	});
});
