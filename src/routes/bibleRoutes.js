const express = require('express');
const bibleController = require('../controllers/bibleController');
const requireAuth = require('../middlewares/requireAuth');

const router = express.Router();

/**
 * @route   GET /API/v1/bible/verse-of-the-day
 * @desc    Get the verse of the day (no authentication required)
 * @access  Public
 */
router.get('/verse-of-the-day', bibleController.getVerseOfTheDay);

/**
 * @route   GET /API/v1/bible/verse/:reference
 * @desc    Get a specific verse by reference (authentication required)
 * @access  Private
 * @param   {string} reference - Bible verse reference (e.g., "JHN.3.16", "PSA.23")
 */
router.get('/verse/:reference', requireAuth, bibleController.getVerse);

/**
 * @route   GET /API/v1/bible/search
 * @desc    Search for verses containing specific text (authentication required)
 * @access  Private
 * @query   {string} query - Search query
 * @query   {number} limit - Maximum number of results (default: 10, max: 50)
 */
router.get('/search', requireAuth, bibleController.searchVerses);

module.exports = router;
