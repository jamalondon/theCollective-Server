const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
	createSeries,
	getAllSeries,
	getSeries,
	updateSeries,
	deleteSeries,
} = require('../controllers/sermonSeriesController');
const {
	validateSermonSeriesCreate,
	validateSermonSeriesUpdate,
	validateSeriesId,
} = require('../middlewares/validators/sermonSeriesValidator');
const requireAuth = require('../middlewares/requireAuth');

// Configure multer for memory storage (cover image uploads)
const upload = multer({ storage: multer.memoryStorage() });

// Protect all routes
router.use(requireAuth);

// Series routes
router
	.route('/')
	.get(getAllSeries)
	.post(validateSermonSeriesCreate, createSeries);

router
	.route('/:seriesId')
	.get(validateSeriesId, getSeries)
	.patch(validateSeriesId, upload.single('coverImage'), validateSermonSeriesUpdate, updateSeries)
	.delete(validateSeriesId, deleteSeries);

module.exports = router;
