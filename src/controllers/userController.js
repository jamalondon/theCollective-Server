const { createClient } = require('@supabase/supabase-js');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_SERVICE_KEY
);

/*
 Upload profile picture for authenticated user
 Handles file upload to Supabase storage and updates user record
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

/*
 Search for users by name
 Returns partial user information for search results
 */
exports.searchUsers = catchAsync(async (req, res, next) => {
	const { query } = req.query;

	if (!query) {
		return next(new AppError('Search query is required', 400));
	}

	// Trim and validate query
	const searchQuery = query.trim();
	if (searchQuery.length < 1) {
		return next(new AppError('Search query must be at least 1 character', 400));
	}

	console.log('🔍 Searching for:', searchQuery);

	// Now try the search query
	const { data: users, error } = await supabase
		.from('users')
		.select('id, full_name, username, profile_picture')
		.ilike('full_name', `%${searchQuery}%`)
		.limit(20);

	console.log('🎯 Search results:', users);
	console.log('❌ Search error:', error);

	
	if (error) {
		console.error('Search users error:', error);
		throw error;
	}

	res.status(200).json({
		success: true,
		data: users || [],
	});
});

/*
 Get prayer requests created by the authenticated user
 Includes request details and current status
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

/*
 Get prayer requests the user has commented on
 Includes the prayer request details and user's comments
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

/*
 Get events the user has attended or registered for
 Includes event details and attendance status
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

/*
 Get sermon discussions the user has participated in
 Includes sermon details and user's discussion contributions
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

/*
 Get comprehensive user profile information
 Includes basic profile data and activity summary
 */
exports.getUserProfile = catchAsync(async (req, res, next) => {
	const userId = req.user.id;

	// Get user basic information
	const { data: user, error: userError } = await supabase
		.from('users')
		.select('id, username, full_name, profile_picture, date_of_birth, created_at')
		.eq('id', userId)
		.single();

	if (userError) throw userError;

	// Get activity counts in parallel
	const [
		{ count: prayerRequestCount },
		{ count: prayerCommentCount },
		{ count: eventsAttendedCount },
		{ count: sermonDiscussionCount },
		{ count: eventsCreatedCount },
		{ count: friendCount },
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
		supabase
			.from('events')
			.select('*', { count: 'exact', head: true })
			.eq('owner->>id', userId),
		supabase
			.from('friendships')
			.select('*', { count: 'exact', head: true })
			.or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
			.eq('status', 'accepted'),
	]);

	res.status(200).json({
		success: true,
		user,
		activitySummary: {
			prayerRequestsCreated: prayerRequestCount || 0,
			prayerRequestsCommented: prayerCommentCount || 0,
			eventsAttended: eventsAttendedCount || 0,
			sermonDiscussionsParticipated: sermonDiscussionCount || 0,
			eventsCreated: eventsCreatedCount || 0,
			friends: friendCount || 0,
		},
	});
});

/*
 Get news feed containing all prayer requests and events
 Returns a combined feed of recent prayer requests and events
 */
exports.getNewsFeed = catchAsync(async (req, res, next) => {
	const { limit = 20 } = req.query;

	// Fetch prayer requests and events in parallel
	const [prayerRequestsResponse, eventsResponse] = await Promise.all([
		supabase
			.from('prayer_requests')
			.select('*')
			.order('created_at', { ascending: false })
			.limit(limit),
		supabase
			.from('events')
			.select('*')
			.order('created_at', { ascending: false })
			.limit(limit),
	]);

	// Check for errors
	if (prayerRequestsResponse.error) throw prayerRequestsResponse.error;
	if (eventsResponse.error) throw eventsResponse.error;

	// Add type identifier to each item and combine
	const prayerRequests = (prayerRequestsResponse.data || []).map((item) => ({
		...item,
		type: 'prayer_request',
	}));

	const events = (eventsResponse.data || []).map((item) => ({
		...item,
		type: 'event',
	}));

	// Combine and sort by creation date
	const newsFeed = [...prayerRequests, ...events].sort(
		(a, b) => new Date(b.created_at) - new Date(a.created_at)
	);

	res.status(200).json({
		success: true,
		data: {
			feed: newsFeed,
			counts: {
				prayerRequests: prayerRequests.length,
				events: events.length,
				total: newsFeed.length,
			},
		},
	});
});

// ============================================
// FRIEND MANAGEMENT FUNCTIONS
// ============================================

/*
 Send a friend request to another user
 Creates a pending friendship record
 */
exports.sendFriendRequest = catchAsync(async (req, res, next) => {
	const { userId } = req.body;
	const requesterId = req.user.id;

	if (!userId) {
		return next(new AppError('User ID is required', 400));
	}

	if (userId === requesterId) {
		return next(new AppError('You cannot send a friend request to yourself', 400));
	}

	// Check if target user exists
	const { data: targetUser, error: userError } = await supabase
		.from('users')
		.select('id')
		.eq('id', userId)
		.single();

	if (userError || !targetUser) {
		return next(new AppError('User not found', 404));
	}

	// Check if friendship already exists (in either direction)
	const { data: existingFriendship, error: checkError } = await supabase
		.from('friendships')
		.select('*')
		.or(`and(requester_id.eq.${requesterId},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${requesterId})`)
		.maybeSingle();

	if (checkError && checkError.code !== 'PGRST116') {
		throw checkError;
	}

	if (existingFriendship) {
		if (existingFriendship.status === 'accepted') {
			return next(new AppError('You are already friends with this user', 400));
		} else if (existingFriendship.status === 'pending') {
			// If the other user already sent a request, auto-accept it
			if (existingFriendship.addressee_id === requesterId) {
				const { data: updatedFriendship, error: updateError } = await supabase
					.from('friendships')
					.update({ status: 'accepted' })
					.eq('id', existingFriendship.id)
					.select()
					.single();

				if (updateError) throw updateError;

				return res.status(200).json({
					success: true,
					message: 'Friend request accepted',
					data: updatedFriendship,
				});
			} else {
				return next(new AppError('Friend request already sent', 400));
			}
		} else if (existingFriendship.status === 'rejected') {
			return next(new AppError('Friend request was rejected', 400));
		} else if (existingFriendship.status === 'blocked') {
			return next(new AppError('Unable to send friend request', 400));
		}
	}

	// Create new friend request
	const { data: friendship, error: createError } = await supabase
		.from('friendships')
		.insert({
			requester_id: requesterId,
			addressee_id: userId,
			status: 'pending',
		})
		.select()
		.single();

	if (createError) {
		throw createError;
	}

	res.status(201).json({
		success: true,
		message: 'Friend request sent successfully',
		data: friendship,
	});
});

/*
 Accept a friend request
 Updates the friendship status to 'accepted'
 */
exports.acceptFriendRequest = catchAsync(async (req, res, next) => {
	const { friendshipId } = req.params;
	const userId = req.user.id;

	// Get the friendship and verify the user is the addressee
	const { data: friendship, error: fetchError } = await supabase
		.from('friendships')
		.select('*')
		.eq('id', friendshipId)
		.eq('addressee_id', userId)
		.eq('status', 'pending')
		.single();

	if (fetchError || !friendship) {
		return next(new AppError('Friend request not found', 404));
	}

	// Update status to accepted
	const { data: updatedFriendship, error: updateError } = await supabase
		.from('friendships')
		.update({ status: 'accepted' })
		.eq('id', friendshipId)
		.select()
		.single();

	if (updateError) throw updateError;

	res.status(200).json({
		success: true,
		message: 'Friend request accepted',
		data: updatedFriendship,
	});
});

/*
 Reject a friend request
 Updates the friendship status to 'rejected'
 */
exports.rejectFriendRequest = catchAsync(async (req, res, next) => {
	const { friendshipId } = req.params;
	const userId = req.user.id;

	// Get the friendship and verify the user is the addressee
	const { data: friendship, error: fetchError } = await supabase
		.from('friendships')
		.select('*')
		.eq('id', friendshipId)
		.eq('addressee_id', userId)
		.eq('status', 'pending')
		.single();

	if (fetchError || !friendship) {
		return next(new AppError('Friend request not found', 404));
	}

	// Update status to rejected
	const { data: updatedFriendship, error: updateError } = await supabase
		.from('friendships')
		.update({ status: 'rejected' })
		.eq('id', friendshipId)
		.select()
		.single();

	if (updateError) throw updateError;

	res.status(200).json({
		success: true,
		message: 'Friend request rejected',
		data: updatedFriendship,
	});
});

/*
 Cancel a pending friend request
 Deletes the friendship record if user is the requester
 */
exports.cancelFriendRequest = catchAsync(async (req, res, next) => {
	const { friendshipId } = req.params;
	const userId = req.user.id;

	// Verify the friendship exists and user is the requester
	const { data: friendship, error: fetchError } = await supabase
		.from('friendships')
		.select('*')
		.eq('id', friendshipId)
		.eq('requester_id', userId)
		.eq('status', 'pending')
		.single();

	if (fetchError || !friendship) {
		return next(new AppError('Friend request not found', 404));
	}

	// Delete the friendship
	const { error: deleteError } = await supabase
		.from('friendships')
		.delete()
		.eq('id', friendshipId);

	if (deleteError) throw deleteError;

	res.status(200).json({
		success: true,
		message: 'Friend request cancelled',
	});
});

/*
 Remove a friend
 Deletes the friendship record (unfriend)
 */
exports.removeFriend = catchAsync(async (req, res, next) => {
	const { userId } = req.params;
	const currentUserId = req.user.id;

	if (!userId) {
		return next(new AppError('User ID is required', 400));
	}

	// Find the friendship (can be in either direction)
	const { data: friendship, error: fetchError } = await supabase
		.from('friendships')
		.select('*')
		.or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUserId})`)
		.eq('status', 'accepted')
		.maybeSingle();

	if (fetchError && fetchError.code !== 'PGRST116') {
		throw fetchError;
	}

	if (!friendship) {
		return next(new AppError('Friendship not found', 404));
	}

	// Delete the friendship
	const { error: deleteError } = await supabase
		.from('friendships')
		.delete()
		.eq('id', friendship.id);

	if (deleteError) throw deleteError;

	res.status(200).json({
		success: true,
		message: 'Friend removed successfully',
	});
});

/*
 Get user's friends list
 Returns all accepted friendships with user details
 */
exports.getFriends = catchAsync(async (req, res, next) => {
	const userId = req.user.id;
	const { page = 1, limit = 50 } = req.query;
	const offset = (page - 1) * limit;

	// Get friendships where user is either requester or addressee and status is accepted
	const { data: friendships, error: friendshipError } = await supabase
		.from('friendships')
		.select('*')
		.or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
		.eq('status', 'accepted')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (friendshipError) throw friendshipError;

	// Extract friend user IDs
	const friendIds = friendships.map((friendship) =>
		friendship.requester_id === userId
			? friendship.addressee_id
			: friendship.requester_id
	);

	if (friendIds.length === 0) {
		return res.status(200).json({
			success: true,
			data: [],
			pagination: {
				currentPage: parseInt(page),
				totalPages: 0,
				totalCount: 0,
				hasNext: false,
				hasPrev: false,
			},
		});
	}

	// Get user details for friends
	const { data: friends, error: usersError } = await supabase
		.from('users')
		.select('id, username, full_name, profile_picture, created_at')
		.in('id', friendIds);

	if (usersError) throw usersError;

	// Get total count for pagination
	const { count, error: countError } = await supabase
		.from('friendships')
		.select('*', { count: 'exact', head: true })
		.or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
		.eq('status', 'accepted');

	if (countError) throw countError;

	res.status(200).json({
		success: true,
		data: friends,
		pagination: {
			currentPage: parseInt(page),
			totalPages: Math.ceil(count / limit),
			totalCount: count,
			hasNext: page * limit < count,
			hasPrev: page > 1,
		},
	});
});

/*
 Get pending friend requests received by the user
 Returns friend requests where user is the addressee
 */
exports.getPendingFriendRequests = catchAsync(async (req, res, next) => {
	const userId = req.user.id;
	const { page = 1, limit = 20 } = req.query;
	const offset = (page - 1) * limit;

	// Get pending requests where user is the addressee
	const { data: friendRequests, error: requestError } = await supabase
		.from('friendships')
		.select('*')
		.eq('addressee_id', userId)
		.eq('status', 'pending')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (requestError) throw requestError;

	if (friendRequests.length === 0) {
		return res.status(200).json({
			success: true,
			data: [],
			pagination: {
				currentPage: parseInt(page),
				totalPages: 0,
				totalCount: 0,
				hasNext: false,
				hasPrev: false,
			},
		});
	}

	// Get requester user details
	const requesterIds = friendRequests.map((req) => req.requester_id);
	const { data: requesters, error: usersError } = await supabase
		.from('users')
		.select('id, username, full_name, profile_picture, created_at')
		.in('id', requesterIds);

	if (usersError) throw usersError;

	// Combine friendship data with user data
	const requestsWithUsers = friendRequests.map((request) => ({
		...request,
		requester: requesters.find((user) => user.id === request.requester_id),
	}));

	// Get total count for pagination
	const { count, error: countError } = await supabase
		.from('friendships')
		.select('*', { count: 'exact', head: true })
		.eq('addressee_id', userId)
		.eq('status', 'pending');

	if (countError) throw countError;

	res.status(200).json({
		success: true,
		data: requestsWithUsers,
		pagination: {
			currentPage: parseInt(page),
			totalPages: Math.ceil(count / limit),
			totalCount: count,
			hasNext: page * limit < count,
			hasPrev: page > 1,
		},
	});
});

/*
 Get friend requests sent by the user
 Returns friend requests where user is the requester
 */
exports.getSentFriendRequests = catchAsync(async (req, res, next) => {
	const userId = req.user.id;
	const { page = 1, limit = 20 } = req.query;
	const offset = (page - 1) * limit;

	// Get pending requests where user is the requester
	const { data: friendRequests, error: requestError } = await supabase
		.from('friendships')
		.select('*')
		.eq('requester_id', userId)
		.eq('status', 'pending')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (requestError) throw requestError;

	if (friendRequests.length === 0) {
		return res.status(200).json({
			success: true,
			data: [],
			pagination: {
				currentPage: parseInt(page),
				totalPages: 0,
				totalCount: 0,
				hasNext: false,
				hasPrev: false,
			},
		});
	}

	// Get addressee user details
	const addresseeIds = friendRequests.map((req) => req.addressee_id);
	const { data: addressees, error: usersError } = await supabase
		.from('users')
		.select('id, username, full_name, profile_picture, created_at')
		.in('id', addresseeIds);

	if (usersError) throw usersError;

	// Combine friendship data with user data
	const requestsWithUsers = friendRequests.map((request) => ({
		...request,
		addressee: addressees.find((user) => user.id === request.addressee_id),
	}));

	// Get total count for pagination
	const { count, error: countError } = await supabase
		.from('friendships')
		.select('*', { count: 'exact', head: true })
		.eq('requester_id', userId)
		.eq('status', 'pending');

	if (countError) throw countError;

	res.status(200).json({
		success: true,
		data: requestsWithUsers,
		pagination: {
			currentPage: parseInt(page),
			totalPages: Math.ceil(count / limit),
			totalCount: count,
			hasNext: page * limit < count,
			hasPrev: page > 1,
		},
	});
});

/*
 Get friendship status with a specific user
 Returns the friendship status between current user and target user
 */
exports.getFriendshipStatus = catchAsync(async (req, res, next) => {
	const { userId } = req.params;
	const currentUserId = req.user.id;

	if (!userId) {
		return next(new AppError('User ID is required', 400));
	}

	if (userId === currentUserId) {
		return res.status(200).json({
			success: true,
			data: { status: 'self' },
		});
	}

	// Check for friendship in either direction
	const { data: friendship, error: friendshipError } = await supabase
		.from('friendships')
		.select('*')
		.or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUserId})`)
		.maybeSingle();

	if (friendshipError && friendshipError.code !== 'PGRST116') {
		throw friendshipError;
	}

	if (!friendship) {
		return res.status(200).json({
			success: true,
			data: { status: 'none' },
		});
	}

	// Determine the perspective
	const isRequester = friendship.requester_id === currentUserId;
	const statusInfo = {
		status: friendship.status,
		friendshipId: friendship.id,
		isRequester,
		createdAt: friendship.created_at,
	};

	res.status(200).json({
		success: true,
		data: statusInfo,
	});
});

/*
 Return all the users in the database
*/
exports.getAllUsers = catchAsync(async (req, res, next) => {
	const { page = 1, limit = 20 } = req.query;
	const offset = (page - 1) * limit;

	const { data: users, error } = await supabase
		.from('users')
		.select('*')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) throw error;

	res.status(200).json({
		success: true,
		data: users,
		pagination: {
			currentPage: parseInt(page),
			totalPages: Math.ceil(users.length / limit),
			totalCount: users.length,
			hasNext: page * limit < users.length,
			hasPrev: page > 1,
		},
	});
});
