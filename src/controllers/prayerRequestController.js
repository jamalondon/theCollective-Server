const supabase = require('../supabase');
const { populateOwner, populateUser } = require('../utils/populateUserInfo');
const { sendPrayerRequestCreatedPush } = require('../utils/expoPush');
const { 
	sendPrayerRequestLikeNotification, 
	sendPrayerRequestCommentNotification 
} = require('../services/notificationService');


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

		// Prepare prayer request object with only owner_id
		const prayerRequest = {
			owner_id: user.id,
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

		// Fire-and-forget push broadcast (do not block response)
		sendPrayerRequestCreatedPush(data[0]).catch((e) => {
			console.error('Push notification send failed:', e?.message || e);
		});

		// Populate owner info (handles anonymous case)
		const populatedRequest = await populateOwner(data[0], { isAnonymous });

		res.status(201).json({ prayerRequest: populatedRequest });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

exports.getPrayerRequests = async (req, res) => {
	try {
		const user = req.user; // from optionalAuth middleware (may be undefined)
		
		const { data, error } = await supabase
			.from('prayer_requests')
			.select('*')
			.order('created_at', { ascending: false });

		if (error) throw error;

		// Populate owner info for all prayer requests
		const populatedRequests = await populateOwner(data);

		// Get like counts and user's likes for all prayer requests
		if (populatedRequests && populatedRequests.length > 0) {
			const prayerRequestIds = populatedRequests.map((pr) => pr.id);
			
			// Get like counts grouped by prayer_request_id
			const { data: likeCounts, error: likeError } = await supabase
				.from('prayer_request_likes')
				.select('prayer_request_id')
				.in('prayer_request_id', prayerRequestIds);

			if (likeError) throw likeError;

			// Count likes per prayer request
			const likeCountMap = {};
			likeCounts?.forEach((like) => {
				likeCountMap[like.prayer_request_id] = (likeCountMap[like.prayer_request_id] || 0) + 1;
			});

			// Get user's likes if authenticated
			let userLikedSet = new Set();
			if (user) {
				const { data: userLikes, error: userLikesError } = await supabase
					.from('prayer_request_likes')
					.select('prayer_request_id')
					.eq('user_id', user.id)
					.in('prayer_request_id', prayerRequestIds);

				if (userLikesError) throw userLikesError;

				userLikes?.forEach((like) => {
					userLikedSet.add(like.prayer_request_id);
				});
			}

			// Add likeCount and likedByUser to each prayer request
			populatedRequests.forEach((pr) => {
				pr.likeCount = likeCountMap[pr.id] || 0;
				pr.likedByUser = userLikedSet.has(pr.id);
			});
		}

		res.status(200).json({
			total: populatedRequests ? populatedRequests.length : 0,
			prayerRequests: populatedRequests,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

/*
 Get a single prayer request by ID with details
 GET /API/v1/prayer-requests/:id
 */
exports.getPrayerRequest = async (req, res) => {
	try {
		const user = req.user; // from optionalAuth middleware (may be undefined)
		const { id } = req.params;

		// Fetch the prayer request
		const { data: prayerRequest, error: fetchError } = await supabase
			.from('prayer_requests')
			.select('*')
			.eq('id', id)
			.single();

		if (fetchError || !prayerRequest) {
			return res.status(404).json({ error: 'Prayer request not found' });
		}

		// Get like count
		const { count: likeCount } = await supabase
			.from('prayer_request_likes')
			.select('*', { count: 'exact', head: true })
			.eq('prayer_request_id', id);

		// Check if user has liked this prayer request
		let likedByUser = false;
		if (user) {
			const { data: userLike } = await supabase
				.from('prayer_request_likes')
				.select('id')
				.eq('prayer_request_id', id)
				.eq('user_id', user.id)
				.single();

			likedByUser = !!userLike;
		}

		// Get comments for this prayer request
		const { data: comments, error: commentsError } = await supabase
			.from('prayer_request_comments')
			.select('*')
			.eq('prayer_request_id', id)
			.order('created_at', { ascending: true });

		if (commentsError) throw commentsError;

		// Populate user info for comments
		const populatedComments = await populateUser(comments || []);

		// Populate owner info
		const populatedRequest = await populateOwner(prayerRequest);

		res.status(200).json({
			prayerRequest: {
				...populatedRequest,
				likeCount: likeCount || 0,
				likedByUser,
				commentCount: populatedComments.length,
				comments: populatedComments,
			},
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

/*
 Delete a prayer request
 DELETE /API/v1/prayer-requests/:id
 */
exports.deletePrayerRequest = async (req, res) => {
	try {
		const user = req.user; // from requireAuth middleware
		const { id } = req.params;

		// Fetch the prayer request to check ownership and get photos
		const { data: prayerRequest, error: fetchError } = await supabase
			.from('prayer_requests')
			.select('owner_id, photos')
			.eq('id', id)
			.single();

		if (fetchError || !prayerRequest) {
			return res.status(404).json({ error: `Prayer request not found` });
		}

		if (prayerRequest.owner_id !== user.id) {
			return res
				.status(403)
				.json({ error: 'You can only delete your own prayer requests' });
		}

		// Delete associated media from prayer-media bucket
		if (prayerRequest.photos && prayerRequest.photos.length > 0) {
			const filePaths = prayerRequest.photos.map((url) => {
				// Extract file path from public URL
				// URL format: {SUPABASE_URL}/storage/v1/object/public/prayer-media/{path}
				const bucketPath = '/storage/v1/object/public/prayer-media/';
				const pathIndex = url.indexOf(bucketPath);
				if (pathIndex !== -1) {
					return url.substring(pathIndex + bucketPath.length);
				}
				return null;
			}).filter(Boolean);

			if (filePaths.length > 0) {
				const { error: storageError } = await supabase.storage
					.from('prayer-media')
					.remove(filePaths);

				if (storageError) {
					console.error('Error deleting media from storage:', storageError);
					// Continue with deletion even if storage cleanup fails
				}
			}
		}

		// Delete the prayer request from database
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
/*
 Add a comment to a prayer request
 POST /API/v1/prayer-requests/:id/comments
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

		// Insert comment with only user_id
		const { data: comment, error: insertError } = await supabase
			.from('prayer_request_comments')
			.insert([
				{
					prayer_request_id: prayerRequestId,
					user_id: user.id,
					text,
				},
			])
			.select()
			.single();

		if (insertError) throw insertError;

		// Populate user info
		const populatedComment = await populateUser(comment);

		// Fire-and-forget notification to prayer request owner (do not block response)
		sendPrayerRequestCommentNotification(prayerRequest, comment, user).catch((e) => {
			console.error('Prayer request comment notification failed:', e?.message || e);
		});

		res.status(201).json({ comment: populatedComment });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

/*
 Get all comments for a prayer request
 GET /API/v1/prayer-requests/:id/comments
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

		// Get all comments for the prayer request
		const { data: comments, error: commentsError } = await supabase
			.from('prayer_request_comments')
			.select('*')
			.eq('prayer_request_id', prayerRequestId)
			.order('created_at', { ascending: true });

		if (commentsError) throw commentsError;

		// Populate user info for all comments
		const populatedComments = await populateUser(comments);

		res.status(200).json({
			total: populatedComments.length,
			comments: populatedComments,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

/*
 Update a comment
 PUT /API/v1/prayer-requests/:id/comments/:commentId
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

		if (existingComment.user_id !== user.id) {
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

		// Populate user info
		const populatedComment = await populateUser(updatedComment);

		res.status(200).json({ comment: populatedComment });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

/*
 Delete a comment
 DELETE /API/v1/prayer-requests/:id/comments/:commentId
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
			.select('owner_id')
			.eq('id', prayerRequestId)
			.single();

		if (prFetchError || !prayerRequest) {
			return res.status(404).json({ error: 'Prayer request not found' });
		}

		// Allow deletion if user is comment owner OR prayer request owner
		const isCommentOwner = existingComment.user_id === user.id;
		const isPrayerRequestOwner = prayerRequest.owner_id === user.id;

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

// Prayer Request Like Controllers

/*
 Like a prayer request
 POST /API/v1/prayer-requests/:id/like
 */
exports.likePrayerRequest = async (req, res) => {
	try {
		const user = req.user;
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

		// Check if user already liked this prayer request
		const { data: existingLike } = await supabase
			.from('prayer_request_likes')
			.select('id')
			.eq('prayer_request_id', prayerRequestId)
			.eq('user_id', user.id)
			.single();

		if (existingLike) {
			return res.status(400).json({ error: 'You have already liked this prayer request' });
		}

		// Insert the like with only user_id
		const { data: like, error: insertError } = await supabase
			.from('prayer_request_likes')
			.insert([
				{
					prayer_request_id: prayerRequestId,
					user_id: user.id,
				},
			])
			.select()
			.single();

		if (insertError) throw insertError;

		// Get updated like count
		const { count } = await supabase
			.from('prayer_request_likes')
			.select('*', { count: 'exact', head: true })
			.eq('prayer_request_id', prayerRequestId);

		// Populate user info
		const populatedLike = await populateUser(like);

		// Fire-and-forget notification to prayer request owner (do not block response)
		sendPrayerRequestLikeNotification(prayerRequest, like, user).catch((e) => {
			console.error('Prayer request like notification failed:', e?.message || e);
		});

		res.status(201).json({ 
			message: 'Prayer request liked successfully',
			like: populatedLike,
			likeCount: count 
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

/*
 Unlike a prayer request
 DELETE /API/v1/prayer-requests/:id/like
 */
exports.unlikePrayerRequest = async (req, res) => {
	try {
		const user = req.user;
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

		// Delete the like
		const { error: deleteError } = await supabase
			.from('prayer_request_likes')
			.delete()
			.eq('prayer_request_id', prayerRequestId)
			.eq('user_id', user.id);

		if (deleteError) throw deleteError;

		// Get updated like count
		const { count } = await supabase
			.from('prayer_request_likes')
			.select('*', { count: 'exact', head: true })
			.eq('prayer_request_id', prayerRequestId);

		res.status(200).json({ 
			message: 'Prayer request unliked successfully',
			likeCount: count 
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

/*
 Get likes for a prayer request
 GET /API/v1/prayer-requests/:id/likes
 */
exports.getPrayerRequestLikes = async (req, res) => {
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

		// Get all likes for the prayer request
		const { data: likes, error: likesError } = await supabase
			.from('prayer_request_likes')
			.select('*')
			.eq('prayer_request_id', prayerRequestId)
			.order('created_at', { ascending: false });

		if (likesError) throw likesError;

		// Populate user info for all likes
		const populatedLikes = await populateUser(likes);

		res.status(200).json({
			total: populatedLikes.length,
			likes: populatedLikes,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

// Comment Like Controllers

/*
 Like a comment
 POST /API/v1/prayer-requests/:id/comments/:commentId/like
 */
exports.likeComment = async (req, res) => {
	try {
		const user = req.user;
		const { commentId } = req.params;

		// Check if comment exists
		const { data: comment, error: fetchError } = await supabase
			.from('prayer_request_comments')
			.select('id')
			.eq('id', commentId)
			.single();

		if (fetchError || !comment) {
			return res.status(404).json({ error: 'Comment not found' });
		}

		// Check if user already liked this comment
		const { data: existingLike } = await supabase
			.from('prayer_request_comment_likes')
			.select('id')
			.eq('comment_id', commentId)
			.eq('user_id', user.id)
			.single();

		if (existingLike) {
			return res.status(400).json({ error: 'You have already liked this comment' });
		}

		// Insert the like with only user_id
		const { data: like, error: insertError } = await supabase
			.from('prayer_request_comment_likes')
			.insert([
				{
					comment_id: commentId,
					user_id: user.id,
				},
			])
			.select()
			.single();

		if (insertError) throw insertError;

		// Get updated like count
		const { count } = await supabase
			.from('prayer_request_comment_likes')
			.select('*', { count: 'exact', head: true })
			.eq('comment_id', commentId);

		// Populate user info
		const populatedLike = await populateUser(like);

		res.status(201).json({ 
			message: 'Comment liked successfully',
			like: populatedLike,
			likeCount: count 
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

/*
 Unlike a comment
 DELETE /API/v1/prayer-requests/:id/comments/:commentId/like
 */
exports.unlikeComment = async (req, res) => {
	try {
		const user = req.user;
		const { commentId } = req.params;

		// Check if comment exists
		const { data: comment, error: fetchError } = await supabase
			.from('prayer_request_comments')
			.select('id')
			.eq('id', commentId)
			.single();

		if (fetchError || !comment) {
			return res.status(404).json({ error: 'Comment not found' });
		}

		// Delete the like
		const { error: deleteError } = await supabase
			.from('prayer_request_comment_likes')
			.delete()
			.eq('comment_id', commentId)
			.eq('user_id', user.id);

		if (deleteError) throw deleteError;

		// Get updated like count
		const { count } = await supabase
			.from('prayer_request_comment_likes')
			.select('*', { count: 'exact', head: true })
			.eq('comment_id', commentId);

		res.status(200).json({ 
			message: 'Comment unliked successfully',
			likeCount: count 
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

/*
 Get likes for a comment
 GET /API/v1/prayer-requests/:id/comments/:commentId/likes
 */
exports.getCommentLikes = async (req, res) => {
	try {
		const { commentId } = req.params;

		// Check if comment exists
		const { data: comment, error: fetchError } = await supabase
			.from('prayer_request_comments')
			.select('id')
			.eq('id', commentId)
			.single();

		if (fetchError || !comment) {
			return res.status(404).json({ error: 'Comment not found' });
		}

		// Get all likes for the comment
		const { data: likes, error: likesError } = await supabase
			.from('prayer_request_comment_likes')
			.select('*')
			.eq('comment_id', commentId)
			.order('created_at', { ascending: false });

		if (likesError) throw likesError;

		// Populate user info for all likes
		const populatedLikes = await populateUser(likes);

		res.status(200).json({
			total: populatedLikes.length,
			likes: populatedLikes,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};
