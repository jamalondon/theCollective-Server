const { GoogleGenAI } = require("@google/genai");


/**
 * Middleware to generate a title for prayer requests if not provided
 * Uses AI to summarize the prayer request text into a short title
 */
const prayerRequestModifier = async (req, res, next) => {
	try {
		const ai = new GoogleGenAI({});

		
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
        
		// Call the Gemini API to generate a title, only wait 5 seconds
		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: prayerText.trim(),
			config: {
				systemInstruction: "You are to summarize the text that is given to you in as little words as possible. The summary will be the title of a social media post so try to make it make sense. DO NOT EXCEED 6 words",
				thinking_config: {
					thinking_budget: 0
				}
			  },
		  });
		// Extract the generated title from the response
		const generatedTitle = response.text.trim();
		req.body.title = generatedTitle;
		next();
	} catch (error) {
		console.error('Error generating prayer title:', error.message); 

		const isAnonymous = req.body.anonymous === 'true' || req.body.anonymous === true;
		
		if (!isAnonymous) {
			// Only use the user's first name for the title
			const firstName = req.user.full_name.split(' ')[0];
			req.body.title = 'Prayers needed for ' + firstName;
		} else {
			req.body.title = 'Prayers needed';
		}
		next();
	}
};

module.exports = prayerRequestModifier;
