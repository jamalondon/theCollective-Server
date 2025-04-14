const express = require('express');
const router = express.Router();
const {
	createDiscussion,
	getDiscussions,
	getDiscussion,
	updateDiscussion,
	deleteDiscussion,
	addComment,
	updateComment,
	deleteComment,
} = require('../controllers/sermonDiscussionController');
const {
	validateSermonDiscussion,
	validateComment,
	validateDiscussionId,
	validateCommentId,
} = require('../middlewares/validators/sermonDiscussionValidator');
const requireAuth = require('../middlewares/requireAuth');

// Protect all routes
router.use(requireAuth);

// Discussion routes
router
	.route('/')
	.get(getDiscussions)
	.post(validateSermonDiscussion, createDiscussion);

router
	.route('/:discussionId')
	.get(validateDiscussionId, getDiscussion)
	.patch(validateDiscussionId, validateSermonDiscussion, updateDiscussion)
	.delete(validateDiscussionId, deleteDiscussion);

// Comment routes
router
	.route('/:discussionId/comments')
	.post(validateDiscussionId, validateComment, addComment);

router
	.route('/:discussionId/comments/:commentId')
	.patch(
		validateDiscussionId,
		validateCommentId,
		validateComment,
		updateComment
	)
	.delete(validateDiscussionId, validateCommentId, deleteComment);

module.exports = router;
