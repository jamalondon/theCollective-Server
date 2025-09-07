const express = require('express');
const {
	validateSignup,
	validateSignin,
	validateStartVerify,
	validateCheckVerify,
} = require('../middlewares/validators/authValidator');
const {
	signup,
	signin,
	verifyToken,
	startVerify,
	checkVerify,
} = require('../controllers/authControllers');

const router = express.Router();

router.post('/signup', validateSignup, signup);
router.post('/signin', validateSignin, signin);
router.post('/verify', verifyToken);

// SMS verification endpoints
router.post('/start-verify', validateStartVerify, startVerify);
router.post('/check-verify', validateCheckVerify, checkVerify);

module.exports = router;
