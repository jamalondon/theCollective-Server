const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const requireAuth = require('../middlewares/requireAuth');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Supabase client
const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_SERVICE_KEY
);

// Profile picture upload route
router.post(
	'/upload-profile-picture',
	requireAuth,
	upload.single('profilePicture'),
	async (req, res) => {
		try {
			if (!req.file) {
				return res.status(400).json({ message: 'No file uploaded' });
			}

			const timestamp = new Date().getTime();
			const fileExtension = req.file.originalname.split('.').pop();
			const fileName = `profile-pictures/${req.user.id}-${timestamp}.${fileExtension}`;

			// Upload file to Supabase Storage
			const { data, error } = await supabase.storage
				.from('user-profileimg')
				.upload(fileName, req.file.buffer, {
					contentType: req.file.mimetype,
					upsert: true,
				});

			if (error) {
				throw error;
			}

			// Get the public URL
			const {
				data: { publicUrl },
			} = supabase.storage.from('user-profileimg').getPublicUrl(fileName);

			// Update user in Supabase
			const { error: updateError } = await supabase
				.from('users')
				.update({ profile_picture: publicUrl })
				.eq('id', req.user.id);

			if (updateError) {
				throw updateError;
			}

			res.status(200).json({
				message: 'Profile picture uploaded successfully',
				profilePictureUrl: publicUrl,
			});
		} catch (error) {
			console.error('Error uploading profile picture:', error);
			res.status(500).json({ message: 'Error uploading profile picture' });
		}
	}
);

// You can add other user-related routes here
// For example:
// router.get('/profile', authMiddleware, async (req, res) => { ... });

module.exports = router;
