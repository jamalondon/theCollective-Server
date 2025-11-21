const localLMAPI = require('../APIs/LocalLMAPI');

const prayerTitleModifier = async (req, res, next) => {
	try {
		// Check if title is provided and not empty
		const hasTitle = req.body.title && req.body.title.trim() !== '';
		
		if (hasTitle) {
			// Title provided, just trim it and move on
			req.body.title = req.body.title.trim();
			return next();
		}
		
		// No title provided, generate one using the LM API
		const prayerText = req.body.text;
		
		if (!prayerText || prayerText.trim() === '') {
			// No text to summarize, let the controller handle validation
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
		console.error('Error generating prayer title:', error.message);
		// If LM API fails, just continue without a generated title
		// The controller will use its fallback
		next();
	}
};

module.exports = prayerTitleModifier;

