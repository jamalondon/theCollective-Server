const express = require('express');
const {
	validateSignup,
	validateSignin,
} = require('../middlewares/validators/authValidator');
const {
	signup,
	signin,
	verifyToken,
} = require('../controllers/authControllers');

const router = express.Router();

router.post('/signup', validateSignup, signup);
router.post('/signin', validateSignin, signin);
router.post('/verify', verifyToken);

module.exports = router;
