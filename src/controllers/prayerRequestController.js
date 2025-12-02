const supabase = require('../supabase');

// Prayer Request Controllers
exports.createPrayerRequest = async (req, res) => {
	try {
		const user = req.user; // from requireAuth middleware
		const { body } = req;
		console.log(body);
		// Extract and validate text from body
		let { text, anonymous } = body;
		if (typeof text === 'string') {
			text = text.trim();
		}
		if (!text) {
			return res
				.status(400)
				.json({ error: 'Prayer request text is required.' });
		}

		// Parse anonymous flag (default to false if not provided)
		const isAnonymous = anonymous === 'true' || anonymous === true || false;

	// Upload photos to Supabase Storage
	let photoUrls = [];
	const files = req.files;
	
	// Only process files if they exist and are in an array with items
	if (files && Array.isArray(files) && files.length > 0) {
		console.log(`Uploading ${files.length} files to Supabase...`);
		for (const file of files) {
			const filePath = `prayer-requests/${user.id}/${Date.now()}_${
				file.originalname
			}`;
			console.log(`Uploading file to path: ${filePath}`);
			console.log(`File size: ${file.size} bytes, mimetype: ${file.mimetype}`);
			
			const { data, error } = await supabase.storage
				.from('prayer-media')
				.upload(filePath, file.buffer, {
					contentType: file.mimetype,
					upsert: false,
				});
			
			if (error) {
				console.error('Supabase storage upload error:', error);
				throw error;
			}
			
			console.log('Upload successful, data:', data);
			const { data: urlData } = supabase.storage
				.from('prayer-media')
				.getPublicUrl(filePath);
			const publicUrl = urlData.publicUrl;
			console.log('Public URL:', publicUrl);
			photoUrls.push(publicUrl);
		}
	}

		const title = req.body.title
			? req.body.title.trim()
			: 'Pray for ' + user.full_name;

		// Prepare prayer request object
		// Use ownerInfo from middleware (handles anonymous case)
		const prayerRequest = {
			owner: req.ownerInfo || {
				id: user.id,
				name: user.full_name,
				profile_picture: user.profile_picture,
			},
			comments: [],
			photos: photoUrls,
			text,
			title,
			anonymous: isAnonymous,
		};

		// Insert into Supabase
		const { data, error } = await supabase
			.from('prayer_requests')
			.insert([prayerRequest])
			.select();

		if (error) throw error;

		res.status(201).json({ prayerRequest: data[0] });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

exports.getPrayerRequests = async (req, res) => {
	try {
		const { data, error } = await supabase
			.from('prayer_requests')
			.select('*')
			.order('created_at', { ascending: false });

		if (error) throw error;

		res.status(200).json({
			total: data ? data.length : 0,
			prayerRequests: data,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

exports.deletePrayerRequest = async (req, res) => {
	try {
		const user = req.user; // from requireAuth middleware
		const { id } = req.params;

		// Fetch the prayer request to check ownership
		const { data: prayerRequest, error: fetchError } = await supabase
			.from('prayer_requests')
			.select('owner')
			.eq('id', id)
			.single();

		if (fetchError || !prayerRequest) {
			return res.status(404).json({ error: `Prayer request not found` });
		}

		if (prayerRequest.owner.id !== user.id) {
			return res
				.status(403)
				.json({ error: 'You can only delete your own prayer requests' });
		}

		const { error: deleteError } = await supabase
			.from('prayer_requests')
			.delete()
			.eq('id', id);

		if (deleteError) throw deleteError;

		res.status(200).json({ message: 'Prayer request deleted successfully' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

// Prayer Request Comment Controllers
/**
 * Add a comment to a prayer request
 * POST /API/v1/prayer-requests/:id/comments
 */
exports.addComment = async (req, res) => {
	try {
		const user = req.user;
		const { id: prayerRequestId } = req.params;
		let { text } = req.body;

		// Validate text
		if (typeof text === 'string') {
			text = text.trim();
		}
		if (!text) {
			return res.status(400).json({ error: 'Comment text is required.' });
		}

		// Check if prayer request exists
		const { data: prayerRequest, error: fetchError } = await supabase
			.from('prayer_requests')
			.select('id')
			.eq('id', prayerRequestId)
			.single();

		if (fetchError || !prayerRequest) {
			return res.status(404).json({ error: 'Prayer request not found' });
		}

		// Insert comment into the database
		const { data: comment, error: insertError } = await supabase
			.from('prayer_request_comments')
			.insert([
				{
					prayer_request_id: prayerRequestId,
					user: {
						id: user.id,
						name: user.full_name,
						profile_picture: user.profile_picture,
					},
					text,
				},
			])
			.select()
			.single();

		if (insertError) throw insertError;

		res.status(201).json({ comment });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

/**
 * Get all comments for a prayer request
 * GET /API/v1/prayer-requests/:id/comments
 */
exports.getComments = async (req, res) => {
	try {
		const { id: prayerRequestId } = req.params;

		// Check if prayer request exists
		const { data: prayerRequest, error: fetchError } = await supabase
			.from('prayer_requests')
			.select('id')
			.eq('id', prayerRequestId)
			.single();

		if (fetchError || !prayerRequest) {
			return res.status(404).json({ error: 'Prayer request not found' });
		}

		// Get all comments for the prayer request (user info is embedded in each comment)
		const { data: comments, error: commentsError } = await supabase
			.from('prayer_request_comments')
			.select('*')
			.eq('prayer_request_id', prayerRequestId)
			.order('created_at', { ascending: true });

		if (commentsError) throw commentsError;

		res.status(200).json({
			total: comments.length,
			comments,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

/**
 * Update a comment
 * PUT /API/v1/prayer-requests/:id/comments/:commentId
 */
exports.updateComment = async (req, res) => {
	try {
		const user = req.user;
		const { commentId } = req.params;
		let { text } = req.body;

		// Validate text
		if (typeof text === 'string') {
			text = text.trim();
		}
		if (!text) {
			return res.status(400).json({ error: 'Comment text is required.' });
		}

		// Check if comment exists and belongs to the user
		const { data: existingComment, error: fetchError } = await supabase
			.from('prayer_request_comments')
			.select('*')
			.eq('id', commentId)
			.single();

		if (fetchError || !existingComment) {
			return res.status(404).json({ error: 'Comment not found' });
		}

		if (existingComment.user.id !== user.id) {
			return res
				.status(403)
				.json({ error: 'You can only edit your own comments' });
		}

		// Update the comment
		const { data: updatedComment, error: updateError } = await supabase
			.from('prayer_request_comments')
			.update({ text })
			.eq('id', commentId)
			.select()
			.single();

		if (updateError) throw updateError;

		res.status(200).json({ comment: updatedComment });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

/**
 * Delete a comment
 * DELETE /API/v1/prayer-requests/:id/comments/:commentId
 */
exports.deleteComment = async (req, res) => {
	try {
		const user = req.user;
		const { id: prayerRequestId, commentId } = req.params;

		// Check if comment exists
		const { data: existingComment, error: fetchError } = await supabase
			.from('prayer_request_comments')
			.select('*')
			.eq('id', commentId)
			.single();

		if (fetchError || !existingComment) {
			return res.status(404).json({ error: 'Comment not found' });
		}

		// Check if prayer request exists and get owner
		const { data: prayerRequest, error: prFetchError } = await supabase
			.from('prayer_requests')
			.select('owner')
			.eq('id', prayerRequestId)
			.single();

		if (prFetchError || !prayerRequest) {
			return res.status(404).json({ error: 'Prayer request not found' });
		}

		// Allow deletion if user is comment owner OR prayer request owner
		const isCommentOwner = existingComment.user.id === user.id;
		const isPrayerRequestOwner = prayerRequest.owner.id === user.id;

		if (!isCommentOwner && !isPrayerRequestOwner) {
			return res.status(403).json({
				error:
					'You can only delete your own comments or comments on your prayer requests',
			});
		}

		// Delete the comment
		const { error: deleteError } = await supabase
			.from('prayer_request_comments')
			.delete()
			.eq('id', commentId);

		if (deleteError) throw deleteError;

		res.status(200).json({ message: 'Comment deleted successfully' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};
