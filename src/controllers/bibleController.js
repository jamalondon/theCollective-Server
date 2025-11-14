const bibleAPI = require('../APIs/BibleAPI');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Predefined list of popular verses for verse of the day
const POPULAR_VERSES = [
	'JER.29.11',
	'PSA.23',
	'1COR.4.4-8',
	'PHP.4.13',
	'JHN.3.16',
	'ROM.8.28',
	'ISA.41.10',
	'PSA.46.1',
	'GAL.5.22-23',
	'HEB.11.1',
	'2TI.1.7',
	'1COR.10.13',
	'PRO.22.6',
	'ISA.40.31',
	'JOS.1.9',
	'HEB.12.2',
	'MAT.11.28',
	'ROM.10.9-10',
	'PHP.2.3-4',
	'MAT.5.43-44',
	'PSA.119.105',
	'EPH.2.8-9',
	'1JN.4.19',
	'PRO.3.5-6',
	'MAT.6.26',
	'2COR.5.17',
	'PSA.139.14',
	'1PET.5.7',
	'ROM.12.2',
	'JAS.1.17',
	'PSA.37.4',
];

// Default Bible ID for English Standard Version
const DEFAULT_BIBLE_ID = '06125adad2d5898a-01'; // ESV

/**
 * Get verse of the day
 * Uses the current date to select a consistent verse for the entire day
 */
const getVerseOfTheDay = catchAsync(async (req, res, next) => {
	try {
		// Use the day of the year to get a consistent verse for the entire day
		const now = new Date();
		const start = new Date(now.getFullYear(), 0, 0);
		const diff = now - start;
		const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

		// Use modulo to ensure we don't exceed array bounds
		const verseIndex = dayOfYear % POPULAR_VERSES.length;
		const verseID = POPULAR_VERSES[verseIndex];

		// Make API call to get the verse
		const response = await bibleAPI.get(`/bibles/${DEFAULT_BIBLE_ID}/search`, {
			params: {
				query: verseID,
				limit: 1,
			},
		});

		if (
			!response.data ||
			!response.data.data ||
			!response.data.data.passages ||
			response.data.data.passages.length === 0
		) {
			return next(new AppError('Verse not found', 404));
		}

		const passage = response.data.data.passages[0];

		// Clean up the content by removing extra whitespace and formatting
		const cleanContent = passage.content
			.replace(/<[^>]*>/g, '') // Remove HTML tags
			.replace(/\s+/g, ' ') // Replace multiple spaces with single space
			.trim();

		const verseData = {
			reference: passage.reference,
			content: cleanContent,
			verseId: verseID,
			bibleId: DEFAULT_BIBLE_ID,
			date: now.toISOString().split('T')[0], // Current date in YYYY-MM-DD format
			copyright: response.data.data.passages[0].copyright || null,
		};

		res.status(200).json({
			status: 'success',
			data: {
				verse: verseData,
			},
		});
	} catch (error) {
		console.error('Bible API Error:', error.response?.data || error.message);

		if (error.response?.status === 401) {
			return next(new AppError('Invalid Bible API key', 401));
		} else if (error.response?.status === 404) {
			return next(new AppError('Verse not found', 404));
		} else if (error.response?.status === 429) {
			return next(
				new AppError('Rate limit exceeded. Please try again later.', 429)
			);
		}

		return next(new AppError('Failed to fetch verse of the day', 500));
	}
});

/**
 * Get a specific verse by reference
 */
const getVerse = catchAsync(async (req, res, next) => {
	const { reference } = req.params;

	if (!reference) {
		return next(new AppError('Verse reference is required', 400));
	}

	try {
		const response = await bibleAPI.get(`/bibles/${DEFAULT_BIBLE_ID}/search`, {
			params: {
				query: reference,
				limit: 1,
			},
		});

		if (
			!response.data ||
			!response.data.data ||
			!response.data.data.passages ||
			response.data.data.passages.length === 0
		) {
			return next(new AppError('Verse not found', 404));
		}

		const passage = response.data.data.passages[0];

		// Clean up the content
		const cleanContent = passage.content
			.replace(/<[^>]*>/g, '') // Remove HTML tags
			.replace(/\s+/g, ' ') // Replace multiple spaces with single space
			.trim();

		const verseData = {
			reference: passage.reference,
			content: cleanContent,
			verseId: reference,
			bibleId: DEFAULT_BIBLE_ID,
			copyright: response.data.data.passages[0].copyright || null,
		};

		res.status(200).json({
			status: 'success',
			data: {
				verse: verseData,
			},
		});
	} catch (error) {
		console.error('Bible API Error:', error.response?.data || error.message);

		if (error.response?.status === 401) {
			return next(new AppError('Invalid Bible API key', 401));
		} else if (error.response?.status === 404) {
			return next(new AppError('Verse not found', 404));
		} else if (error.response?.status === 429) {
			return next(
				new AppError('Rate limit exceeded. Please try again later.', 429)
			);
		}

		return next(new AppError('Failed to fetch verse', 500));
	}
});

/**
 * Search for verses containing specific text
 */
const searchVerses = catchAsync(async (req, res, next) => {
	const { query, limit = 10 } = req.query;

	if (!query) {
		return next(new AppError('Search query is required', 400));
	}

	try {
		const response = await bibleAPI.get(`/bibles/${DEFAULT_BIBLE_ID}/search`, {
			params: {
				query: query,
				limit: Math.min(parseInt(limit), 50), // Cap at 50 results
			},
		});

		if (!response.data || !response.data.data || !response.data.data.passages) {
			return next(new AppError('No verses found', 404));
		}

		const verses = response.data.data.passages.map((passage) => ({
			reference: passage.reference,
			content: passage.content
				.replace(/<[^>]*>/g, '') // Remove HTML tags
				.replace(/\s+/g, ' ') // Replace multiple spaces with single space
				.trim(),
			bibleId: DEFAULT_BIBLE_ID,
		}));

		res.status(200).json({
			status: 'success',
			results: verses.length,
			data: {
				verses: verses,
			},
		});
	} catch (error) {
		console.error('Bible API Error:', error.response?.data || error.message);

		if (error.response?.status === 401) {
			return next(new AppError('Invalid Bible API key', 401));
		} else if (error.response?.status === 429) {
			return next(
				new AppError('Rate limit exceeded. Please try again later.', 429)
			);
		}

		return next(new AppError('Failed to search verses', 500));
	}
});

module.exports = {
	getVerseOfTheDay,
	getVerse,
	searchVerses,
};
