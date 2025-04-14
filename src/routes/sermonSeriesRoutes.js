const express = require('express');
const router = express.Router();
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
	.patch(validateSeriesId, validateSermonSeriesUpdate, updateSeries)
	.delete(validateSeriesId, deleteSeries);

module.exports = router;
