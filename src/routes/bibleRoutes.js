const express = require('express');
const bibleController = require('../controllers/bibleController');
const requireAuth = require('../middlewares/requireAuth');

const router = express.Router();

// Test endpoint to check API connection and available Bibles
router.get('/test', bibleController.testConnection);

// Verse of the day endpoint
router.get('/verse-of-the-day', bibleController.getVerseOfTheDay);

router.get('/verse/:reference', requireAuth, bibleController.getVerse);

router.get('/search', requireAuth, bibleController.searchVerses);

module.exports = router;
