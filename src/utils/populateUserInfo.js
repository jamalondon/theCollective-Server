const supabase = require('../supabase');

// Default profile picture URL from Supabase storage
const SUPABASE_URL = process.env.SUPABASE_URL;
const DEFAULT_PROFILE_PICTURE = `${SUPABASE_URL}/storage/v1/object/public/defaults/default_profile_pic.jpg`;

/**
 * Cache for user info to reduce database calls within a single request
 */
let userCache = new Map();

/**
 * Clears the user cache - call this at the start of each request if needed
 */
const clearCache = () => {
	userCache = new Map();
};

/**
 * Fetches user info from the database (with caching)
 * @param {string} userId - The user's ID
 * @returns {Promise<Object|null>} User info object or null if not found
 */
const fetchUserInfo = async (userId) => {
	if (!userId) return null;

	// Check cache first
	if (userCache.has(userId)) {
		return userCache.get(userId);
	}

	try {
		const { data: user, error } = await supabase
			.from('users')
			.select('id, full_name, username, profile_picture')
			.eq('id', userId)
			.single();

		if (error || !user) {
			return null;
		}

		const userInfo = {
			id: user.id,
			name: user.full_name,
			username: user.username,
			profile_picture: user.profile_picture || DEFAULT_PROFILE_PICTURE,
		};

		// Cache the result
		userCache.set(userId, userInfo);

		return userInfo;
	} catch (err) {
		console.error('Error fetching user info:', err);
		return null;
	}
};

/**
 * Fetches multiple users' info at once (batch operation with caching)
 * @param {string[]} userIds - Array of user IDs
 * @returns {Promise<Map<string, Object>>} Map of userId -> userInfo
 */
const fetchMultipleUsersInfo = async (userIds) => {
	if (!userIds || userIds.length === 0) return new Map();

	// Filter out nulls/undefined and already cached users
	const uniqueIds = [...new Set(userIds.filter((id) => id && !userCache.has(id)))];
	const result = new Map();

	// Add cached users to result
	userIds.forEach((id) => {
		if (id && userCache.has(id)) {
			result.set(id, userCache.get(id));
		}
	});

	if (uniqueIds.length === 0) return result;

	try {
		const { data: users, error } = await supabase
			.from('users')
			.select('id, full_name, username, profile_picture')
			.in('id', uniqueIds);

		if (error) {
			console.error('Error fetching multiple users:', error);
			return result;
		}

		users.forEach((user) => {
			const userInfo = {
				id: user.id,
				name: user.full_name,
				username: user.username,
				profile_picture: user.profile_picture || DEFAULT_PROFILE_PICTURE,
			};
			userCache.set(user.id, userInfo);
			result.set(user.id, userInfo);
		});

		return result;
	} catch (err) {
		console.error('Error fetching multiple users info:', err);
		return result;
	}
};

/**
 * Populates owner info for items (events, prayer requests, etc.)
 * Replaces owner_id with a full owner object containing user details
 * 
 * @param {Object|Object[]} itemOrItems - Single item or array of items to populate
 * @returns {Promise<Object|Object[]>} Item(s) with populated owner info
 * 
 * @example
 * // Single item
 * const event = await populateOwner(eventData);
 * 
 * @example
 * // Array of items
 * const events = await populateOwner(eventsArray);
 */
const populateOwner = async (itemOrItems) => {
	// Handle null/undefined
	if (!itemOrItems) return itemOrItems;

	// Handle array
	if (Array.isArray(itemOrItems)) {
		if (itemOrItems.length === 0) return itemOrItems;

		// Collect all unique owner_ids (skip anonymous items)
		const ownerIds = itemOrItems
			.filter((item) => item.owner_id && !item.anonymous)
			.map((item) => item.owner_id);

		// Fetch all users at once
		const usersMap = await fetchMultipleUsersInfo(ownerIds);

		// Populate each item
		return itemOrItems.map((item) => {
			if (!item.owner_id) return item;

			// Create a copy without owner_id
			const { owner_id, ...itemWithoutOwnerId } = item;

			if (item.anonymous) {
				return {
					...itemWithoutOwnerId,
					owner: {
						id: owner_id,
						name: 'Anonymous',
						username: 'anonymous',
						profile_picture: DEFAULT_PROFILE_PICTURE,
					},
				};
			}

			const userInfo = usersMap.get(owner_id);
			if (!userInfo) return item;

			return {
				...itemWithoutOwnerId,
				owner: userInfo,
			};
		});
	}

	// Handle single item
	if (!itemOrItems.owner_id) return itemOrItems;

	const { owner_id, ...itemWithoutOwnerId } = itemOrItems;

	if (itemOrItems.anonymous) {
		return {
			...itemWithoutOwnerId,
			owner: {
				id: owner_id,
				name: 'Anonymous',
				username: 'anonymous',
				profile_picture: DEFAULT_PROFILE_PICTURE,
			},
		};
	}

	const userInfo = await fetchUserInfo(owner_id);
	if (!userInfo) return itemOrItems;

	return {
		...itemWithoutOwnerId,
		owner: userInfo,
	};
};

/**
 * Populates user info for items (comments, likes, etc.)
 * Replaces user_id with a full user object containing user details
 * 
 * @param {Object|Object[]} itemOrItems - Single item or array of items to populate
 * @returns {Promise<Object|Object[]>} Item(s) with populated user info
 * 
 * @example
 * // Single comment
 * const comment = await populateUser(commentData);
 * 
 * @example
 * // Array of comments
 * const comments = await populateUser(commentsArray);
 */
const populateUser = async (itemOrItems) => {
	// Handle null/undefined
	if (!itemOrItems) return itemOrItems;

	// Handle array
	if (Array.isArray(itemOrItems)) {
		if (itemOrItems.length === 0) return itemOrItems;

		// Collect all unique user_ids
		const userIds = itemOrItems
			.filter((item) => item.user_id)
			.map((item) => item.user_id);

		// Fetch all users at once
		const usersMap = await fetchMultipleUsersInfo(userIds);

		// Populate each item
		return itemOrItems.map((item) => {
			if (!item.user_id) return item;

			const userInfo = usersMap.get(item.user_id);
			if (!userInfo) return item;

			// Create a copy without user_id
			const { user_id, ...itemWithoutUserId } = item;

			return {
				...itemWithoutUserId,
				user: userInfo,
			};
		});
	}

	// Handle single item
	if (!itemOrItems.user_id) return itemOrItems;

	const userInfo = await fetchUserInfo(itemOrItems.user_id);
	if (!userInfo) return itemOrItems;

	// Create a copy without user_id
	const { user_id, ...itemWithoutUserId } = itemOrItems;

	return {
		...itemWithoutUserId,
		user: userInfo,
	};
};

module.exports = {
	clearCache,
	fetchUserInfo,
	populateOwner,
	populateUser,
	DEFAULT_PROFILE_PICTURE,
};
