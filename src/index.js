//ENV variables
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
	dotenv.config({ path: '.env.production' });
} else {
	dotenv.config({ path: '.env.development' });
}

// Initialize Supabase client
const supabase = require('./supabase');

// variable to test Supabase connection
const testSupabaseConnection = async () => {
	try {
		const { data, error } = await supabase.auth.getSession();
		if (error) throw error;
		console.log('Successfully connected to Supabase');
	} catch (err) {
		console.error('Error connecting to Supabase:', err.message);
	}
};

//test the Supabase connection
testSupabaseConnection();

//libraries
//express is a web framework for node.js
//body-parser is a middleware to parse incoming request bodies in a middleware before your handlers
const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');

//routes to be used in the API
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');
const sermonSeriesRoutes = require('./routes/sermonSeriesRoutes');
const sermonDiscussionRoutes = require('./routes/sermonDiscussionRoutes');
const sermonRoutes = require('./routes/sermonRoutes');
const prayerRequestRoutes = require('./routes/prayerRequestRoutes');
const bibleRoutes = require('./routes/bibleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

//middlewares to be used in the API
const requireAuth = require('./middlewares/requireAuth');
const errorHandler = require('./middlewares/errorHandler');
// Clear cached user info each request so profile data stays fresh
const { clearCache } = require('./utils/populateUserInfo');

//define a custom date format for the logger
logger.token('localdate', () => {
	return new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
});

//extract the user info for the logger. If it fails, return a dash
logger.token('user', (req) => {
	try {
		//extract the user from the request
		const candidate = req.user.full_name;

		if (candidate === undefined || candidate === null || candidate === '')
			return '-';

		return candidate;
	} catch (_) {
		return '-';
	}
});

//represents our whole API. Atleast the root of it
const app = express();

//using middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(
	logger(
		'Method: :method\nUser: :user\nURL: :url\nStatus: :status\nContent-Length: :res[content-length]\nTotal time: :total-time ms\nDate: :localdate (CT)\n\n',
	),
);

// Clear user info cache for every incoming request
app.use((req, res, next) => {
	clearCache();
	next();
});

//all the routes for the API
app.use('/API/v1/auth', authRoutes);
app.use('/API/v1/events', eventRoutes);
app.use('/API/v1/users', userRoutes);
app.use('/API/v1/sermon-series', sermonSeriesRoutes);
app.use('/API/v1/sermon-discussions', sermonDiscussionRoutes);
app.use('/API/v1/sermons', sermonRoutes);
app.use('/API/v1/prayer-requests', prayerRequestRoutes);
app.use('/API/v1/bible', bibleRoutes);
app.use('/API/v1/notifications', notificationRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

//main route handler
app.get('/', requireAuth, (req, res) => {
	res.send(`Your username: ${req.user.username}`);
});

//make the API listen on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`);
});
