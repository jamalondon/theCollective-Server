const express = require('express');
const router = express.Router();
const {
  createSermon,
  getSermons,
  getSermon,
  updateSermon,
  deleteSermon,
} = require('../controllers/sermonController');
const { validateSermon, validateSermonId } = require('../middlewares/validators/sermonValidator');
const requireAuth = require('../middlewares/requireAuth');

router.use(requireAuth);

router.route('/').get(getSermons).post(validateSermon, createSermon);

router
  .route('/:sermonId')
  .get(validateSermonId, getSermon)
  .patch(validateSermonId, validateSermon, updateSermon)
  .delete(validateSermonId, deleteSermon);

module.exports = router;
