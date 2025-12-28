const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/requireAuth');
const notificationPreferencesController = require('../controllers/notificationPreferencesController');

// All notification preference routes require authentication
router.use(requireAuth);

// Get user's notification preferences
router.get('/preferences', notificationPreferencesController.getNotificationPreferences);

// Update user's notification preferences
router.put('/preferences', notificationPreferencesController.updateNotificationPreferences);

// Reset notification preferences to defaults
router.post('/preferences/reset', notificationPreferencesController.resetNotificationPreferences);

module.exports = router;
