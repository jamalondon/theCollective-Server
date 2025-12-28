const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/requireAuth');
const userFollowController = require('../controllers/userFollowController');

// All follow routes require authentication
router.use(requireAuth);

// Follow a user
router.post('/:userId/follow', userFollowController.followUser);

// Unfollow a user
router.delete('/:userId/follow', userFollowController.unfollowUser);

// Get follow status for a user
router.get('/:userId/follow/status', userFollowController.getFollowStatus);

// Get follow statistics for a user
router.get('/:userId/follow/stats', userFollowController.getFollowStats);

// Get user's followers
router.get('/:userId/followers', userFollowController.getUserFollowers);

// Get users that a user is following
router.get('/:userId/following', userFollowController.getUserFollowing);

module.exports = router;
