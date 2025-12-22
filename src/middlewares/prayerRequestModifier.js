const localLMAPI = require('../APIs/LocalLMAPI');

/**
 * Middleware to generate a title for prayer requests if not provided
 * Uses AI to summarize the prayer request text into a short title
 */
const prayerRequestModifier = async (req, res, next) => {
	try {
		console.log("Body of request:", req.body);
		const user = req.user;

		// Check if title is provided and not empty
		const hasTitle = req.body.title && req.body.title.trim() !== '';
		
		if (hasTitle) {
			// Title provided, just trim it and move on
			req.body.title = req.body.title.trim();
			return next();
		}
		
		// Extract prayer request text from the request body
		const prayerText = req.body.text;
		
		if (!prayerText || prayerText.trim() === '') {
			// No prayer request text to summarize, proceed onward
			return next();
		}
        
		// Call the local LM API to generate a title
		const response = await localLMAPI.post("/v1/chat/completions", {
			model: 'openai/gpt-oss-20b',
			messages: [
				{
					role: 'system',
					content: 'You are to summarize the text that is given to you in as little words as possible. The summary will be the title of a social media post so try to make it make sense. DO NOT EXCEED 6 words'
				},
				{
					role: 'user',
					content: prayerText.trim()
				}
			]
		});
		
		// Extract the generated title from the response
		const generatedTitle = response.data.choices[0].message.content.trim();
		req.body.title = generatedTitle;
		
		next();
	} catch (error) {
		// Log the error
		console.error('Error generating prayer title:', error.message);
		
		// If LM API fails, use a default title based on anonymous status
		const isAnonymous = req.body.anonymous === 'true' || req.body.anonymous === true;
		
		if (!isAnonymous) {
			// Only use the user's first name for the title
			const firstName = req.user.full_name.split(' ')[0];
			req.body.title = 'Prayers needed for ' + firstName;
		} else {
			req.body.title = 'Prayers needed';
		}
		
		// Continue to the controller
		next();
	}
};

module.exports = prayerRequestModifier;
