const supabase = require('../supabase');

// Create a new event
const createEvent = async (req, res) => {
	const { title, description, location, date, tags } = req.body;

	// Validate required fields
	if (!title || !description || !location || !date) {
		return res
			.status(422)
			.send({ error: 'You must provide all required event details' });
	}

	try {
		// Check for scheduling conflicts
		const { data: existingEvent, error: checkError } = await supabase
			.from('events')
			.select('*')
			.eq('location', location)
			.gte('date', new Date(new Date(date).setHours(0, 0, 0, 0)).toISOString())
			.lt(
				'date',
				new Date(new Date(date).setHours(23, 59, 59, 999)).toISOString()
			)
			.maybeSingle();

		if (existingEvent) {
			return res.status(409).send({
				error: 'An event is already scheduled at this time and location',
			});
		}

		// Create a new event with the current user as owner
		const { data: event, error: createError } = await supabase
			.from('events')
			.insert([
				{
					title,
					description,
					location,
					date: new Date(date).toISOString(),
					owner: {
						id: req.user.id,
						name: req.user.full_name,
						username: req.user.username,
						profile_picture: req.user.profile_picture,
					},
					tags: tags || [],
				},
			])
			.select()
			.single();

		if (createError) throw createError;

		// Add the creator as the first attendee
		const { error: attendeeError } = await supabase
			.from('event_attendees')
			.insert([
				{
					event_id: event.id,
					user_id: req.user.id,
				},
			]);

		if (attendeeError) throw attendeeError;

		// Get the created event with attendees
		const { data: eventWithDetails, error: detailsError } = await supabase
			.from('events')
			.select(
				`
				*,
				attendees:event_attendees(
					user:user_id(id, full_name, profile_picture)
				)
			`
			)
			.eq('id', event.id)
			.single();

		if (detailsError) throw detailsError;

		res.status(201).send(eventWithDetails);
	} catch (err) {
		res.status(422).send({ error: err.message });
	}
};

// Get all events
const getAllEvents = async (req, res) => {
	try {
		const { data: events, error } = await supabase
			.from('events')
			.select('*')
			.order('date', { ascending: true });

		if (error) throw error;

		res.send(events);
	} catch (err) {
		res.status(500).send({ error: err.message });
	}
};

// Get events owned by the current user
const getMyEvents = async (req, res) => {
	try {
		const { data: events, error } = await supabase
			.from('events')
			.select('*')
			.eq('owner->>id', req.user.id)
			.order('date', { ascending: true });

		if (error) throw error;
		res.send(events);
	} catch (err) {
		res.status(500).send({ error: err.message });
	}
};

// Get events that the user is attending but not hosting
const getAttendingEvents = async (req, res) => {
	try {
		const { data: events, error } = await supabase
			.from('events')
			.select('*')
			.not('owner->>id', 'eq', req.user.id)
			.eq('event_attendees.user_id', req.user.id)
			.order('date', { ascending: true });

		if (error) throw error;
		res.send(events);
	} catch (err) {
		res.status(500).send({ error: err.message });
	}
};

// Get a specific event by ID
const getEventById = async (req, res) => {
	try {
		const { data: event, error } = await supabase
			.from('events')
			.select(
				`
				*,
				attendees:event_attendees(
					user:user_id(id, full_name, profile_picture)
				)
			`
			)
			.eq('id', req.params.id)
			.single();

		if (error) throw error;
		if (!event) {
			return res.status(404).send({ error: 'Event not found' });
		}

		res.send(event);
	} catch (err) {
		res.status(500).send({ error: err.message });
	}
};

// Update an event
const updateEvent = async (req, res) => {
	const { title, description, location, date } = req.body;

	try {
		// First check if the event exists and the user is the owner
		const { data: existingEvent, error: checkError } = await supabase
			.from('events')
			.select('*')
			.eq('id', req.params.id)
			.single();

		if (checkError) throw checkError;
		if (!existingEvent) {
			return res.status(404).send({ error: 'Event not found' });
		}

		if (existingEvent.owner.id !== req.user.id) {
			return res
				.status(403)
				.send({ error: 'You can only update events you own' });
		}

		// Update the event
		const { data: event, error: updateError } = await supabase
			.from('events')
			.update({
				title: title || existingEvent.title,
				description: description || existingEvent.description,
				location: location || existingEvent.location,
				date: date ? new Date(date).toISOString() : existingEvent.date,
			})
			.eq('id', req.params.id)
			.select()
			.single();

		if (updateError) throw updateError;

		// Get the updated event with attendees
		const { data: eventWithDetails, error: detailsError } = await supabase
			.from('events')
			.select(
				`
				*,
				attendees:event_attendees(
					user:user_id(id, full_name, profile_picture)
				)
			`
			)
			.eq('id', event.id)
			.single();

		if (detailsError) throw detailsError;

		res.send(eventWithDetails);
	} catch (err) {
		res.status(422).send({ error: err.message });
	}
};

// Add attendee to event
const attendEvent = async (req, res) => {
	try {
		// Check if the event exists
		const { data: event, error: eventError } = await supabase
			.from('events')
			.select('*')
			.eq('id', req.params.id)
			.single();

		if (eventError) throw eventError;
		if (!event) {
			return res.status(404).send({ error: 'Event not found' });
		}

		// Check if user is already an attendee
		const { data: existingAttendee, error: attendeeError } = await supabase
			.from('event_attendees')
			.select('*')
			.eq('event_id', req.params.id)
			.eq('user_id', req.user.id)
			.maybeSingle();

		if (existingAttendee) {
			return res
				.status(422)
				.send({ error: 'You are already attending this event' });
		}

		// Add user to attendees
		const { error: insertError } = await supabase
			.from('event_attendees')
			.insert([
				{
					event_id: req.params.id,
					user_id: req.user.id,
				},
			]);

		if (insertError) throw insertError;

		// Get the updated event with attendees
		const { data: eventWithDetails, error: detailsError } = await supabase
			.from('events')
			.select(
				`
				*,
				attendees:event_attendees(
					user:user_id(id, full_name, profile_picture)
				)
			`
			)
			.eq('id', req.params.id)
			.single();

		if (detailsError) throw detailsError;

		res.send(eventWithDetails);
	} catch (err) {
		res.status(422).send({ error: err.message });
	}
};

// Cancel attendance
const cancelAttendance = async (req, res) => {
	try {
		// Check if the event exists
		const { data: event, error: eventError } = await supabase
			.from('events')
			.select('*')
			.eq('id', req.params.id)
			.single();

		if (eventError) throw eventError;
		if (!event) {
			return res.status(404).send({ error: 'Event not found' });
		}

		// Check if user is the owner
		if (event.owner.id === req.user.id) {
			return res
				.status(422)
				.send({ error: 'Event owners cannot cancel their attendance' });
		}

		// Remove user from attendees
		const { error: deleteError } = await supabase
			.from('event_attendees')
			.delete()
			.eq('event_id', req.params.id)
			.eq('user_id', req.user.id);

		if (deleteError) throw deleteError;

		// Get the updated event with attendees
		const { data: eventWithDetails, error: detailsError } = await supabase
			.from('events')
			.select(
				`
				*,
				attendees:event_attendees(
					user:user_id(id, full_name, profile_picture)
				)
			`
			)
			.eq('id', req.params.id)
			.single();

		if (detailsError) throw detailsError;

		res.send(eventWithDetails);
	} catch (err) {
		res.status(422).send({ error: err.message });
	}
};

// Delete an event
const deleteEvent = async (req, res) => {
	try {
		// First check if the event exists and the user is the owner
		const { data: event, error: checkError } = await supabase
			.from('events')
			.select('*')
			.eq('id', req.params.id)
			.single();

		if (checkError) throw checkError;
		if (!event) {
			return res.status(404).send({ error: 'Event not found' });
		}

		if (event.owner.id !== req.user.id) {
			return res
				.status(403)
				.send({ error: 'You can only delete events you own' });
		}

		// Delete the event (this will cascade delete the attendees due to foreign key constraints)
		const { error: deleteError } = await supabase
			.from('events')
			.delete()
			.eq('id', req.params.id);

		if (deleteError) throw deleteError;

		res.send({ message: 'Event deleted successfully' });
	} catch (err) {
		res.status(500).send({ error: err.message });
	}
};

// Search for locations
const searchLocations = async (req, res) => {
	const { query } = req.query;

	if (!query) {
		return res.status(400).send({ error: 'Search query is required' });
	}

	try {
		const { data: locations, error } = await supabase
			.from('locations')
			.select('id, name, address, city, state')
			.or(
				`name.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%`
			)
			.limit(10);

		if (error) throw error;

		// Format locations for frontend display
		const formattedLocations = locations.map((location) => ({
			id: location.id,
			name: location.name,
			subtitle: `${location.city}, ${location.state}`,
			address: location.address,
		}));

		res.send(formattedLocations);
	} catch (err) {
		res.status(500).send({ error: err.message });
	}
};

// =====================================================
// Event Comment Controllers
// =====================================================

//Add a comment to an event
const addComment = async (req, res) => {
	try {
		const user = req.user;
		const { id: eventId } = req.params;
		let { text } = req.body;

		// Validate text
		if (typeof text === 'string') {
			text = text.trim();
		}
		if (!text) {
			return res.status(400).json({ error: 'Comment text is required.' });
		}

		// Check if event exists
		const { data: event, error: fetchError } = await supabase
			.from('events')
			.select('id')
			.eq('id', eventId)
			.single();

		if (fetchError || !event) {
			return res.status(404).json({ error: 'Event not found' });
		}

		// Insert comment into the database
		const { data: comment, error: insertError } = await supabase
			.from('event_comments')
			.insert([
				{
					event_id: eventId,
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

// Get all comments for an event
const getComments = async (req, res) => {
	try {
		const { id: eventId } = req.params;

		// Check if event exists
		const { data: event, error: fetchError } = await supabase
			.from('events')
			.select('id')
			.eq('id', eventId)
			.single();

		if (fetchError || !event) {
			return res.status(404).json({ error: 'Event not found' });
		}

		// Get all comments for the event
		const { data: comments, error: commentsError } = await supabase
			.from('event_comments')
			.select('*')
			.eq('event_id', eventId)
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

//Update a comment
const updateComment = async (req, res) => {
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
			.from('event_comments')
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
			.from('event_comments')
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

//Delete a comment
const deleteComment = async (req, res) => {
	try {
		const user = req.user;
		const { id: eventId, commentId } = req.params;

		// Check if comment exists
		const { data: existingComment, error: fetchError } = await supabase
			.from('event_comments')
			.select('*')
			.eq('id', commentId)
			.single();

		if (fetchError || !existingComment) {
			return res.status(404).json({ error: 'Comment not found' });
		}

		// Check if event exists and get owner
		const { data: event, error: eventFetchError } = await supabase
			.from('events')
			.select('owner')
			.eq('id', eventId)
			.single();

		if (eventFetchError || !event) {
			return res.status(404).json({ error: 'Event not found' });
		}

		// Allow deletion if user is comment owner OR event owner
		const isCommentOwner = existingComment.user.id === user.id;
		const isEventOwner = event.owner.id === user.id;

		if (!isCommentOwner && !isEventOwner) {
			return res.status(403).json({
				error:
					'You can only delete your own comments or comments on your events',
			});
		}

		// Delete the comment
		const { error: deleteError } = await supabase
			.from('event_comments')
			.delete()
			.eq('id', commentId);

		if (deleteError) throw deleteError;

		res.status(200).json({ message: 'Comment deleted successfully' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

// =====================================================
// Event Like Controllers
// =====================================================

//Like an event
const likeEvent = async (req, res) => {
	try {
		const user = req.user;
		const { id: eventId } = req.params;

		// Check if event exists
		const { data: event, error: fetchError } = await supabase
			.from('events')
			.select('id')
			.eq('id', eventId)
			.single();

		if (fetchError || !event) {
			return res.status(404).json({ error: 'Event not found' });
		}

		// Check if user already liked this event
		const { data: existingLike } = await supabase
			.from('event_likes')
			.select('id')
			.eq('event_id', eventId)
			.eq('user->>id', user.id)
			.single();

		if (existingLike) {
			return res.status(400).json({ error: 'You have already liked this event' });
		}

		// Insert the like
		const { data: like, error: insertError } = await supabase
			.from('event_likes')
			.insert([
				{
					event_id: eventId,
					user: {
						id: user.id,
						name: user.full_name,
						profile_picture: user.profile_picture,
					},
				},
			])
			.select()
			.single();

		if (insertError) throw insertError;

		// Get updated like count
		const { count } = await supabase
			.from('event_likes')
			.select('*', { count: 'exact', head: true })
			.eq('event_id', eventId);

		res.status(201).json({ 
			message: 'Event liked successfully',
			like,
			likeCount: count 
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

//Unlike an event
const unlikeEvent = async (req, res) => {
	try {
		const user = req.user;
		const { id: eventId } = req.params;

		// Check if event exists
		const { data: event, error: fetchError } = await supabase
			.from('events')
			.select('id')
			.eq('id', eventId)
			.single();

		if (fetchError || !event) {
			return res.status(404).json({ error: 'Event not found' });
		}

		// Delete the like
		const { error: deleteError } = await supabase
			.from('event_likes')
			.delete()
			.eq('event_id', eventId)
			.eq('user->>id', user.id);

		if (deleteError) throw deleteError;

		// Get updated like count
		const { count } = await supabase
			.from('event_likes')
			.select('*', { count: 'exact', head: true })
			.eq('event_id', eventId);

		res.status(200).json({ 
			message: 'Event unliked successfully',
			likeCount: count 
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

//Get likes for an event
const getEventLikes = async (req, res) => {
	try {
		const { id: eventId } = req.params;

		// Check if event exists
		const { data: event, error: fetchError } = await supabase
			.from('events')
			.select('id')
			.eq('id', eventId)
			.single();

		if (fetchError || !event) {
			return res.status(404).json({ error: 'Event not found' });
		}

		// Get all likes for the event
		const { data: likes, error: likesError } = await supabase
			.from('event_likes')
			.select('*')
			.eq('event_id', eventId)
			.order('created_at', { ascending: false });

		if (likesError) throw likesError;

		res.status(200).json({
			total: likes.length,
			likes,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

// =====================================================
// Event Comment Like Controllers
// =====================================================

	//Like a comment
const likeComment = async (req, res) => {
	try {
		const user = req.user;
		const { commentId } = req.params;

		// Check if comment exists
		const { data: comment, error: fetchError } = await supabase
			.from('event_comments')
			.select('id')
			.eq('id', commentId)
			.single();

		if (fetchError || !comment) {
			return res.status(404).json({ error: 'Comment not found' });
		}

		// Check if user already liked this comment
		const { data: existingLike } = await supabase
			.from('event_comment_likes')
			.select('id')
			.eq('comment_id', commentId)
			.eq('user->>id', user.id)
			.single();

		if (existingLike) {
			return res.status(400).json({ error: 'You have already liked this comment' });
		}

		// Insert the like
		const { data: like, error: insertError } = await supabase
			.from('event_comment_likes')
			.insert([
				{
					comment_id: commentId,
					user: {
						id: user.id,
						name: user.full_name,
						profile_picture: user.profile_picture,
					},
				},
			])
			.select()
			.single();

		if (insertError) throw insertError;

		// Get updated like count
		const { count } = await supabase
			.from('event_comment_likes')
			.select('*', { count: 'exact', head: true })
			.eq('comment_id', commentId);

		res.status(201).json({ 
			message: 'Comment liked successfully',
			like,
			likeCount: count 
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

//Unlike a comment
const unlikeComment = async (req, res) => {
	try {
		const user = req.user;
		const { commentId } = req.params;

		// Check if comment exists
		const { data: comment, error: fetchError } = await supabase
			.from('event_comments')
			.select('id')
			.eq('id', commentId)
			.single();

		if (fetchError || !comment) {
			return res.status(404).json({ error: 'Comment not found' });
		}

		// Delete the like
		const { error: deleteError } = await supabase
			.from('event_comment_likes')
			.delete()
			.eq('comment_id', commentId)
			.eq('user->>id', user.id);

		if (deleteError) throw deleteError;

		// Get updated like count
		const { count } = await supabase
			.from('event_comment_likes')
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

		//Get likes for a comment
const getCommentLikes = async (req, res) => {
	try {
		const { commentId } = req.params;

		// Check if comment exists
		const { data: comment, error: fetchError } = await supabase
			.from('event_comments')
			.select('id')
			.eq('id', commentId)
			.single();

		if (fetchError || !comment) {
			return res.status(404).json({ error: 'Comment not found' });
		}

		// Get all likes for the comment
		const { data: likes, error: likesError } = await supabase
			.from('event_comment_likes')
			.select('*')
			.eq('comment_id', commentId)
			.order('created_at', { ascending: false });

		if (likesError) throw likesError;

		res.status(200).json({
			total: likes.length,
			likes,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

module.exports = {
	createEvent,
	getAllEvents,
	getMyEvents,
	getAttendingEvents,
	getEventById,
	updateEvent,
	attendEvent,
	cancelAttendance,
	deleteEvent,
	searchLocations,
	// Comment controllers //
	addComment,
	getComments,
	updateComment,
	deleteComment,
	// Event like controllers //
	likeEvent,
	unlikeEvent,
	getEventLikes,
	// Comment like controllers
	likeComment,
	unlikeComment,
	getCommentLikes,
};
