const { ensureDefaultAvatarExists } = require('./utils/cloudinaryConfig');

// Initialize default avatar
const initializeCloudinary = async () => {
	try {
		console.log('Initializing default avatar...');
		const defaultAvatarUrl = await ensureDefaultAvatarExists();
		console.log('Default avatar URL:', defaultAvatarUrl);
	} catch (error) {
		console.error('Failed to initialize default avatar:', error);
	}
};

// Call initialization when app starts
initializeCloudinary();
