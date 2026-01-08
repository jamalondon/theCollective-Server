const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/requireAuth');
const notificationPreferencesController = require('../controllers/notificationPreferencesController');

// Get user's notification preferences
router.get(
	'/preferences',
	requireAuth,
	notificationPreferencesController.getNotificationPreferences
);

// Update user's notification preferences
router.put(
	'/preferences',
	requireAuth,
	notificationPreferencesController.updateNotificationPreferences
);

// Reset notification preferences to defaults
router.post(
	'/preferences/reset',
	requireAuth,
	notificationPreferencesController.resetNotificationPreferences
);

module.exports = router;
