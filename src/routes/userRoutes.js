const express = require('express');
const router = express.Router();

const multer = require('multer');
const requireAuth = require('../middlewares/requireAuth');
const userController = require('../controllers/userController');
const pushTokenController = require('../controllers/pushTokenController');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Profile picture upload route
router.post(
	'/upload-profile-picture',
	requireAuth,
	upload.single('profilePicture'),
	userController.uploadProfilePicture
);

// Push token registration route
router.post('/push-token', requireAuth, pushTokenController.upsertPushToken);

// User search route
router.get('/search', requireAuth, userController.searchUsers);

// Get all users
router.get('/all-users', requireAuth, userController.getAllUsers);

// Get user profile with activity summary (own profile or specific user by ID)
router.get('/profile/:userId?', requireAuth, userController.getUserProfile);

// Get user's prayer requests
router.get(
	'/prayer-requests',
	requireAuth,
	userController.getUserPrayerRequests
);

// Get prayer requests user has commented on
router.get(
	'/prayer-comments',
	requireAuth,
	userController.getUserPrayerComments
);

// Get events user has attended or registered for
router.get('/events', requireAuth, userController.getUserEvents);

// Get sermon discussions user has participated in
router.get(
	'/sermon-discussions',
	requireAuth,
	userController.getUserSermonDiscussions
);

// Get news feed with prayer requests and events
router.get('/news-feed', requireAuth, userController.getNewsFeed);

// Send a friend request
router.post('/friends/request', requireAuth, userController.sendFriendRequest);

// Accept a friend request
router.patch(
	'/friends/request/:friendshipId/accept',
	requireAuth,
	userController.acceptFriendRequest
);

// Reject a friend request
router.patch(
	'/friends/request/:friendshipId/reject',
	requireAuth,
	userController.rejectFriendRequest
);

// Cancel a pending friend request
router.delete(
	'/friends/request/:friendshipId/cancel',
	requireAuth,
	userController.cancelFriendRequest
);

// Remove a friend (unfriend)
router.delete('/friends/:userId', requireAuth, userController.removeFriend);

// Get user's friends list
router.get('/friends', requireAuth, userController.getFriends);

// Get pending friend requests (received)
router.get(
	'/friends/requests/pending',
	requireAuth,
	userController.getPendingFriendRequests
);

// Get sent friend requests
router.get(
	'/friends/requests/sent',
	requireAuth,
	userController.getSentFriendRequests
);

// Get friendship status with a specific user
router.get(
	'/friends/status/:userId',
	requireAuth,
	userController.getFriendshipStatus
);

module.exports = router;
