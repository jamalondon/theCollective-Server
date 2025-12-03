const express = require('express');
const router = express.Router();
const multer = require('multer');
const prayerRequestController = require('../controllers/prayerRequestController');
const requireAuth = require('../middlewares/requireAuth');
const prayerRequestModifier = require('../middlewares/prayerRequestModifier');

// Set up multer for file uploads (memory storage for direct upload to Supabase)
const upload = multer({ storage: multer.memoryStorage() });

// POST /API/v1/prayer-request
router.post(
	'/',
	requireAuth,
	upload.array('images', 5), // up to 5 images per request
	prayerRequestModifier,
	prayerRequestController.createPrayerRequest
);

// GET /API/v1/prayer-requests
router.get('/', prayerRequestController.getPrayerRequests);

// GET /API/v1/prayer-requests/:id - Get a single prayer request
router.get('/:id', prayerRequestController.getPrayerRequest);

// DELETE /API/v1/prayer-request/:id
router.delete('/:id', requireAuth, prayerRequestController.deletePrayerRequest);

// Comment Routes //

// POST /API/v1/prayer-requests/:id/comments - Add a comment
router.post('/:id/comments', requireAuth, prayerRequestController.addComment);

// GET /API/v1/prayer-requests/:id/comments - Get all comments for a prayer request
router.get('/:id/comments', prayerRequestController.getComments);

// PUT /API/v1/prayer-requests/:id/comments/:commentId - Update a comment
router.put(
	'/:id/comments/:commentId',
	requireAuth,
	prayerRequestController.updateComment
);

// DELETE /API/v1/prayer-requests/:id/comments/:commentId - Delete a comment
router.delete(
	'/:id/comments/:commentId',
	requireAuth,
	prayerRequestController.deleteComment
);

// Like Routes //

//Like a prayer request
router.post('/:id/like', requireAuth, prayerRequestController.likePrayerRequest);

//Unlike a prayer request
router.delete('/:id/like', requireAuth, prayerRequestController.unlikePrayerRequest);

//Get all likes for a prayer request
router.get('/:id/likes', prayerRequestController.getPrayerRequestLikes);

// Comment Like Routes //

//Like a comment
router.post(
	'/:id/comments/:commentId/like',
	requireAuth,
	prayerRequestController.likeComment
);

//Unlike a comment
router.delete(
	'/:id/comments/:commentId/like',
	requireAuth,
	prayerRequestController.unlikeComment
);

//Get all likes for a comment
router.get(
	'/:id/comments/:commentId/likes',
	prayerRequestController.getCommentLikes
);

module.exports = router;
