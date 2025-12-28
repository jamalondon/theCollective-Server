const supabase = require('../supabase');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * Follow a user
 * POST /API/v1/users/:userId/follow
 */
exports.followUser = catchAsync(async (req, res, next) => {
    const followerId = req.user.id;
    const followingId = req.params.userId;

    // Validate that user is not trying to follow themselves
    if (followerId === followingId) {
        return next(new AppError('You cannot follow yourself', 400));
    }

    // Check if the user to follow exists
    const { data: userToFollow, error: userError } = await supabase
        .from('users')
        .select('id, full_name, username')
        .eq('id', followingId)
        .single();

    if (userError || !userToFollow) {
        return next(new AppError('User not found', 404));
    }

    // Check if already following
    const { data: existingFollow, error: checkError } = await supabase
        .from('user_followers')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

    if (existingFollow) {
        return next(new AppError('You are already following this user', 400));
    }

    // Create the follow relationship
    const { data: follow, error: followError } = await supabase
        .from('user_followers')
        .insert([{
            follower_id: followerId,
            following_id: followingId
        }])
        .select()
        .single();

    if (followError) {
        console.error('Error creating follow relationship:', followError);
        return next(new AppError('Failed to follow user', 500));
    }

    res.status(201).json({
        status: 'success',
        message: `You are now following ${userToFollow.full_name}`,
        data: {
            follow: {
                id: follow.id,
                following: {
                    id: userToFollow.id,
                    name: userToFollow.full_name,
                    username: userToFollow.username
                },
                created_at: follow.created_at
            }
        }
    });
});

/**
 * Unfollow a user
 * DELETE /API/v1/users/:userId/follow
 */
exports.unfollowUser = catchAsync(async (req, res, next) => {
    const followerId = req.user.id;
    const followingId = req.params.userId;

    // Check if the follow relationship exists
    const { data: existingFollow, error: checkError } = await supabase
        .from('user_followers')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

    if (checkError || !existingFollow) {
        return next(new AppError('You are not following this user', 400));
    }

    // Delete the follow relationship
    const { error: deleteError } = await supabase
        .from('user_followers')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

    if (deleteError) {
        console.error('Error deleting follow relationship:', deleteError);
        return next(new AppError('Failed to unfollow user', 500));
    }

    res.status(200).json({
        status: 'success',
        message: 'Successfully unfollowed user'
    });
});

/**
 * Get user's followers
 * GET /API/v1/users/:userId/followers
 */
exports.getUserFollowers = catchAsync(async (req, res, next) => {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Check if user exists
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, full_name, username')
        .eq('id', userId)
        .single();

    if (userError || !user) {
        return next(new AppError('User not found', 404));
    }

    // Get followers with pagination
    const { data: followers, error: followersError } = await supabase
        .from('user_followers')
        .select(`
            id,
            created_at,
            follower:follower_id (
                id,
                full_name,
                username,
                profile_picture
            )
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (followersError) {
        console.error('Error fetching followers:', followersError);
        return next(new AppError('Failed to fetch followers', 500));
    }

    // Get total count
    const { count, error: countError } = await supabase
        .from('user_followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

    if (countError) {
        console.error('Error counting followers:', countError);
    }

    // Format the response
    const formattedFollowers = followers.map(follow => ({
        id: follow.id,
        user: {
            id: follow.follower.id,
            name: follow.follower.full_name,
            username: follow.follower.username,
            profile_picture: follow.follower.profile_picture
        },
        followed_at: follow.created_at
    }));

    res.status(200).json({
        status: 'success',
        data: {
            user: {
                id: user.id,
                name: user.full_name,
                username: user.username
            },
            followers: formattedFollowers,
            pagination: {
                page,
                limit,
                total: count || 0,
                hasNext: page * limit < (count || 0),
                hasPrev: page > 1
            }
        }
    });
});

/**
 * Get users that a user is following
 * GET /API/v1/users/:userId/following
 */
exports.getUserFollowing = catchAsync(async (req, res, next) => {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Check if user exists
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, full_name, username')
        .eq('id', userId)
        .single();

    if (userError || !user) {
        return next(new AppError('User not found', 404));
    }

    // Get following with pagination
    const { data: following, error: followingError } = await supabase
        .from('user_followers')
        .select(`
            id,
            created_at,
            following:following_id (
                id,
                full_name,
                username,
                profile_picture
            )
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (followingError) {
        console.error('Error fetching following:', followingError);
        return next(new AppError('Failed to fetch following', 500));
    }

    // Get total count
    const { count, error: countError } = await supabase
        .from('user_followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

    if (countError) {
        console.error('Error counting following:', countError);
    }

    // Format the response
    const formattedFollowing = following.map(follow => ({
        id: follow.id,
        user: {
            id: follow.following.id,
            name: follow.following.full_name,
            username: follow.following.username,
            profile_picture: follow.following.profile_picture
        },
        followed_at: follow.created_at
    }));

    res.status(200).json({
        status: 'success',
        data: {
            user: {
                id: user.id,
                name: user.full_name,
                username: user.username
            },
            following: formattedFollowing,
            pagination: {
                page,
                limit,
                total: count || 0,
                hasNext: page * limit < (count || 0),
                hasPrev: page > 1
            }
        }
    });
});

/**
 * Check if current user is following another user
 * GET /API/v1/users/:userId/follow/status
 */
exports.getFollowStatus = catchAsync(async (req, res, next) => {
    const followerId = req.user.id;
    const followingId = req.params.userId;

    if (followerId === followingId) {
        return res.status(200).json({
            status: 'success',
            data: {
                is_following: false,
                is_self: true
            }
        });
    }

    // Check if following
    const { data: follow, error } = await supabase
        .from('user_followers')
        .select('id, created_at')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

    res.status(200).json({
        status: 'success',
        data: {
            is_following: !!follow,
            is_self: false,
            followed_at: follow?.created_at || null
        }
    });
});

/**
 * Get follow statistics for a user
 * GET /API/v1/users/:userId/follow/stats
 */
exports.getFollowStats = catchAsync(async (req, res, next) => {
    const userId = req.params.userId;

    // Check if user exists
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, full_name, username')
        .eq('id', userId)
        .single();

    if (userError || !user) {
        return next(new AppError('User not found', 404));
    }

    // Get follower count and following count in parallel
    const [
        { count: followerCount, error: followerError },
        { count: followingCount, error: followingError }
    ] = await Promise.all([
        supabase
            .from('user_followers')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId),
        supabase
            .from('user_followers')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', userId)
    ]);

    if (followerError || followingError) {
        console.error('Error fetching follow stats:', followerError || followingError);
        return next(new AppError('Failed to fetch follow statistics', 500));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user: {
                id: user.id,
                name: user.full_name,
                username: user.username
            },
            stats: {
                followers: followerCount || 0,
                following: followingCount || 0
            }
        }
    });
});
