const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = mongoose.model('User');

const router = express.Router();

router.post('/signup', async (req, res) => {
	//destructure email and password from the request body
	const { email, password, name, dateOfBirth } = req.body;

	try {
		//create a new user
		const user = new User({ email, password, name, dateOfBirth });

		//save the user to the database
		await user.save();

		//generate a token for the user using jwt
		const token = jwt.sign({ userID: user._id }, 'MY_SECRET_KEY');

		//send the token back to the user
		res.send({ token, userID: user._id });
	} catch (err) {
		return res.status(422).send(err.message);
	}
});

router.post('/signin', async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(422).send({ err: 'Must provide email and password' });
	}

	const user = await User.findOne({ email });

	if (!user) {
		return res.status(422).send({ err: 'Invalid password or email' });
	}

	try {
		await user.comparePassword(password);
		const token = jwt.sign({ userID: user._id }, '101774');
		res.send({ token, userID: user._id });
	} catch (err) {
		return res.status(422).send({ err: 'Invalid password or email' });
	}
});

module.exports = router;
