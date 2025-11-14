const axios = require('axios');

const bibleAPI = axios.create({
	baseURL: 'https://api.scripture.api.bible/v1',
	timeout: 10000, // 10 second timeout
	headers: {
		'api-key': process.env.BIBLE_API_KEY,
	},
});

module.exports = bibleAPI;
