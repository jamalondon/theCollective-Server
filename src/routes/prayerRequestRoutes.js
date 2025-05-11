const express = require('express');
const router = express.Router();
const multer = require('multer');
const prayerRequestController = require('../controllers/prayerRequestController');
const requireAuth = require('../middlewares/requireAuth');

// Set up multer for file uploads (memory storage for direct upload to Supabase)
const upload = multer({ storage: multer.memoryStorage() });

// POST /API/v1/prayer-request
router.post(
	'/',
	requireAuth,
	upload.array('photos', 5), // up to 5 photos per request
	prayerRequestController.createPrayerRequest
);

// GET /API/v1/prayer-requests
router.get('/', prayerRequestController.getPrayerRequests);

// DELETE /API/v1/prayer-request/:id
router.delete('/:id', requireAuth, prayerRequestController.deletePrayerRequest);

module.exports = router;
