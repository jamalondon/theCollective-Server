const localLMAPI = require('../APIs/LocalLMAPI');

// Default profile picture URL from Supabase storage
const SUPABASE_URL = process.env.SUPABASE_URL;
const DEFAULT_PROFILE_PICTURE = `${SUPABASE_URL}/storage/v1/object/public/defaults/default_profile_pic.jpg`;

const prayerRequestModifier = async (req, res, next) => {
	try {
		console.log("Body of request:", req.body)
		const user = req.user;
		const isAnonymous = req.body.anonymous === 'true' || req.body.anonymous === true;

		// Prepare owner info based on anonymous flag
		if (isAnonymous) {
			req.ownerInfo = {
				id: user.id,
				name: 'Anonymous',
				profile_picture: DEFAULT_PROFILE_PICTURE,
			};
		} else {
			req.ownerInfo = {
				id: user.id,
				name: user.full_name,
				profile_picture: user.profile_picture,
			};
		}

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
		// If LM API fails, just continue with a default title "Pray for [user name]"
		// only if anonymous is false
		if (!req.body.anonymous || req.body.anonymous === 'false') {
			//only use the users first name for the title
			const firstName = req.user.full_name.split(' ')[0];
			req.body.title = 'Prayers needed for ' + firstName;
		} else {
			req.body.title = 'Prayers needed';
		}
		// The controller will use its fallback
		next();
	}
};

module.exports = prayerRequestModifier;

