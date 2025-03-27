require('./models/User');
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const bodyParser = require('body-parser');
const requireAuth = require('./middlewares/requireAuth');

//represents our whole API. Atleast the root of it
const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use('/API/v1/auth', authRoutes);

//mongooseURI to connect to the database
const mongoURI =
	'mongodb+srv://jamalondon97:X8WlauEJbBhQT4Oe@users.vwnwz.mongodb.net/development?retryWrites=true&w=majority&appName=Users';

//connection method
mongoose.connect(mongoURI);

mongoose.connection.on('connected', () => {
	console.log('Connected to mongo instance');
});

mongoose.connection.on('error', (err) => {
	console.error('Error connecting to mongo', err);
});

//route handler
app.get('/', requireAuth, (req, res) => {
	res.send(`Your email: ${req.user.email}`);
});

//make the API listen on port 3000
app.listen(3000, () => {
	console.log('Listening on port 3000');
});
