//ENV variables
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
	dotenv.config({ path: '.env.production' });
} else {
	dotenv.config({ path: '.env.development' });
}

console.log(`Connected to ${process.env.NODE_ENV} environment`);

// Initialize Supabase client
const supabase = require('./supabase');

//libraries
//express is a web framework for node.js
//mongoose is an ODM for MongoDB and Node.js
//body-parser is a middleware to parse incoming request bodies in a middleware before your handlers
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

//routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');
const sermonSeriesRoutes = require('./routes/sermonSeriesRoutes');
const sermonDiscussionRoutes = require('./routes/sermonDiscussionRoutes');
const prayerRequestRoutes = require('./routes/prayerRequestRoutes');

//middlewares
const requireAuth = require('./middlewares/requireAuth');
const errorHandler = require('./middlewares/errorHandler');

//represents our whole API. Atleast the root of it
const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use('/API/v1/auth', authRoutes);
app.use('/API/v1/events', eventRoutes);
app.use('/API/v1/users', userRoutes);
app.use('/API/v1/sermon-series', sermonSeriesRoutes);
app.use('/API/v1/sermon-discussions', sermonDiscussionRoutes);
app.use('/API/v1/prayer-requests', prayerRequestRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Test Supabase connection
const testSupabaseConnection = async () => {
	try {
		const { data, error } = await supabase.auth.getSession();
		if (error) throw error;
		console.log('Successfully connected to Supabase');
	} catch (err) {
		console.error('Error connecting to Supabase:', err.message);
	}
};

testSupabaseConnection();

//route handler
app.get('/', requireAuth, (req, res) => {
	res.send(`Your email: ${req.user.email}`);
});

//make the API listen on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`);
});
