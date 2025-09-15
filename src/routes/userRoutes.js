const express = require('express');
const router = express.Router();
const multer = require('multer');
const requireAuth = require('../middlewares/requireAuth');
const userController = require('../controllers/userController');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Profile picture upload route
router.post(
	'/upload-profile-picture',
	requireAuth,
	upload.single('profilePicture'),
	userController.uploadProfilePicture
);

// User search route
router.get('/search', requireAuth, userController.searchUsers);

// Get user profile with activity summary
router.get('/profile', requireAuth, userController.getUserProfile);

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

module.exports = router;
