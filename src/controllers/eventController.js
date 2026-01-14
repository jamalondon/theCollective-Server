const supabase = require('../supabase');
const { populateOwner, populateUser } = require('../utils/populateUserInfo');
const { geocodeAddress } = require('../utils/geocode');
const {
	normalizeEventLocation,
	hasAnyLocationField,
} = require('../utils/locationPayload');
const { 
	sendEventCreatedNotification,
	sendEventLikeNotification,
	sendEventCommentNotification 
} = require('../services/notificationService');

function addLocationCompatibility(event) {
	if (!event || typeof event !== 'object') return event;

	const locationName = event.location_name ?? event.locationName ?? null;
	const locationObj = {
		name: locationName,
		address: event.address ?? null,
		city: event.city ?? null,
		state: event.state ?? null,
		latitude: event.latitude ?? null,
		longitude: event.longitude ?? null,
	};

	// Backwards compatibility for older clients
	event.location = locationObj;
	// Friendly camelCase alias for newer clients
	event.locationName = locationName;

	return event;
}

function addLocationCompatibilityToMany(items) {
	if (!items) return items;
	if (Array.isArray(items)) {
		items.forEach(addLocationCompatibility);
		return items;
	}
	return addLocationCompatibility(items);
}

// Create a new event
const createEvent = async (req, res) => {
	const { title, description, date, tags } = req.body;
	const legacyLocation = req.body?.location;
	let {
		location_name,
		address,
		city,
		state,
		latitude,
		longitude,
	} = normalizeEventLocation(req.body);

	// Validate required fields
	if (!title || !description || !date || !hasAnyLocationField({ location_name, address, city, state, latitude, longitude })) {
		return res
			.status(422)
			.send({ error: 'You must provide all required event details' });
	}

	try {
		// Geocode (soft-fail): fill lat/lng and normalize address/city/state if possible.
		// Prefer geocoding the street address; fall back to location name if needed.
		const geocodeBaseAddress = address || location_name;
		const shouldGeocode =
			!!geocodeBaseAddress &&
			(latitude === null ||
				latitude === undefined ||
				longitude === null ||
				longitude === undefined ||
				!address ||
				!city ||
				!state);

		if (shouldGeocode) {
			const geocodeResult = await geocodeAddress({
				address: geocodeBaseAddress,
				city,
				state,
			});

			if (geocodeResult.ok) {
				address = geocodeResult.data.address ?? address;
				city = geocodeResult.data.city ?? city;
				state = geocodeResult.data.state ?? state;
				latitude = geocodeResult.data.latitude ?? latitude;
				longitude = geocodeResult.data.longitude ?? longitude;
			} else {
				// Soft-fail per requirements; keep whatever the client provided.
				console.warn('Geocoding failed (createEvent):', geocodeResult.error);
			}
		}

		// Check for scheduling conflicts
		const conflictField = address ? 'address' : 'location_name';
		const conflictValue = address || location_name;
		const { data: existingEvent, error: checkError } = await supabase
			.from('events')
			.select('*')
			.eq(conflictField, conflictValue)
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

		// Create a new event with only the owner_id
		const { data: event, error: createError } = await supabase
			.from('events')
			.insert([
				{
					title,
					description,
					// Keep legacy location column populated for existing clients/DB constraints.
					// If the client didn't send legacy location, synthesize it.
					location:
						legacyLocation ??
						{
							name: location_name,
							address,
							city,
							state,
							latitude,
							longitude,
						},
					// New structured location fields
					location_name,
					address,
					city,
					state,
					latitude,
					longitude,
					date: new Date(date).toISOString(),
					owner_id: req.user.id,
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

		// Populate owner info
		const populatedEvent = await populateOwner(eventWithDetails);
		addLocationCompatibility(populatedEvent);

		// Fire-and-forget notification to followers (do not block response)
		sendEventCreatedNotification(event, req.user).catch((e) => {
			console.error('Event creation notification failed:', e?.message || e);
		});

		res.status(201).send(populatedEvent);
	} catch (err) {
		res.status(422).send({ error: err.message });
	}
};

// Get all events
const getAllEvents = async (req, res) => {
	try {
		const user = req.user; // from requireAuth middleware
		
		const { data: events, error } = await supabase
			.from('events')
			.select('*')
			.order('date', { ascending: true });

		if (error) throw error;

		// Populate owner info for all events
		const populatedEvents = await populateOwner(events);
		addLocationCompatibilityToMany(populatedEvents);

		// Get like counts and user's likes for all events
		if (populatedEvents && populatedEvents.length > 0) {
			const eventIds = populatedEvents.map((event) => event.id);
			
			const { data: likeCounts, error: likeError } = await supabase
				.from('event_likes')
				.select('event_id')
				.in('event_id', eventIds);

			if (likeError) throw likeError;

			// Count likes per event
			const likeCountMap = {};
			likeCounts?.forEach((like) => {
				likeCountMap[like.event_id] = (likeCountMap[like.event_id] || 0) + 1;
			});

			// Get user's likes
			const { data: userLikes, error: userLikesError } = await supabase
				.from('event_likes')
				.select('event_id')
				.eq('user_id', user.id)
				.in('event_id', eventIds);

			if (userLikesError) throw userLikesError;

			const userLikedSet = new Set();
			userLikes?.forEach((like) => {
				userLikedSet.add(like.event_id);
			});

			// Add likeCount and likedByUser to each event
			populatedEvents.forEach((event) => {
				event.likeCount = likeCountMap[event.id] || 0;
				event.likedByUser = userLikedSet.has(event.id);
			});
		}

		res.send(populatedEvents);
	} catch (err) {
		res.status(500).send({ error: err.message });
	}
};

// Get events owned by the current user
const getMyEvents = async (req, res) => {
	try {
		const user = req.user; // from requireAuth middleware
		
		const { data: events, error } = await supabase
			.from('events')
			.select('*')
			.eq('owner_id', user.id)
			.order('date', { ascending: true });

		if (error) throw error;

		// Populate owner info for all events
		const populatedEvents = await populateOwner(events);
		addLocationCompatibilityToMany(populatedEvents);

		// Get like counts and user's likes for all events
		if (populatedEvents && populatedEvents.length > 0) {
			const eventIds = populatedEvents.map((event) => event.id);
			
			const { data: likeCounts, error: likeError } = await supabase
				.from('event_likes')
				.select('event_id')
				.in('event_id', eventIds);

			if (likeError) throw likeError;

			// Count likes per event
			const likeCountMap = {};
			likeCounts?.forEach((like) => {
				likeCountMap[like.event_id] = (likeCountMap[like.event_id] || 0) + 1;
			});

			// Get user's likes
			const { data: userLikes, error: userLikesError } = await supabase
				.from('event_likes')
				.select('event_id')
				.eq('user_id', user.id)
				.in('event_id', eventIds);

			if (userLikesError) throw userLikesError;

			const userLikedSet = new Set();
			userLikes?.forEach((like) => {
				userLikedSet.add(like.event_id);
			});

			// Add likeCount and likedByUser to each event
			populatedEvents.forEach((event) => {
				event.likeCount = likeCountMap[event.id] || 0;
				event.likedByUser = userLikedSet.has(event.id);
			});
		}

		res.send(populatedEvents);
	} catch (err) {
		res.status(500).send({ error: err.message });
	}
};

// Get events that the user is attending but not hosting
const getAttendingEvents = async (req, res) => {
	try {
		const user = req.user; // from requireAuth middleware
		
		// First get the event IDs the user is attending
		const { data: attendeeRecords, error: attendeeError } = await supabase
			.from('event_attendees')
			.select('event_id')
			.eq('user_id', user.id);

		if (attendeeError) throw attendeeError;

		const eventIds = attendeeRecords.map((record) => record.event_id);

		if (eventIds.length === 0) {
			return res.send([]);
		}

		// Get events where user is attending but not the owner
		const { data: events, error } = await supabase
			.from('events')
			.select('*')
			.in('id', eventIds)
			.neq('owner_id', user.id)
			.order('date', { ascending: true });

		if (error) throw error;

		// Populate owner info for all events
		const populatedEvents = await populateOwner(events);
		addLocationCompatibilityToMany(populatedEvents);

		// Get like counts and user's likes for all events
		if (populatedEvents && populatedEvents.length > 0) {
			const populatedEventIds = populatedEvents.map((event) => event.id);
			
			const { data: likeCounts, error: likeError } = await supabase
				.from('event_likes')
				.select('event_id')
				.in('event_id', populatedEventIds);

			if (likeError) throw likeError;

			// Count likes per event
			const likeCountMap = {};
			likeCounts?.forEach((like) => {
				likeCountMap[like.event_id] = (likeCountMap[like.event_id] || 0) + 1;
			});

			// Get user's likes
			const { data: userLikes, error: userLikesError } = await supabase
				.from('event_likes')
				.select('event_id')
				.eq('user_id', user.id)
				.in('event_id', populatedEventIds);

			if (userLikesError) throw userLikesError;

			const userLikedSet = new Set();
			userLikes?.forEach((like) => {
				userLikedSet.add(like.event_id);
			});

			// Add likeCount and likedByUser to each event
			populatedEvents.forEach((event) => {
				event.likeCount = likeCountMap[event.id] || 0;
				event.likedByUser = userLikedSet.has(event.id);
			});
		}

		res.send(populatedEvents);
	} catch (err) {
		res.status(500).send({ error: err.message });
	}
};

// Get a specific event by ID
const getEventById = async (req, res) => {
	try {
		const user = req.user; // from requireAuth middleware
		
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

		// Get like count
		const { count: likeCount } = await supabase
			.from('event_likes')
			.select('*', { count: 'exact', head: true })
			.eq('event_id', req.params.id);

		// Check if user has liked this event
		const { data: userLike } = await supabase
			.from('event_likes')
			.select('id')
			.eq('event_id', req.params.id)
			.eq('user_id', user.id)
			.single();

		const likedByUser = !!userLike;

		// Get comments for this event
		const { data: comments, error: commentsError } = await supabase
			.from('event_comments')
			.select('*')
			.eq('event_id', req.params.id)
			.order('created_at', { ascending: true });

		if (commentsError) throw commentsError;

		// Populate user info for comments
		const populatedComments = await populateUser(comments || []);

		// Populate owner info
		const populatedEvent = await populateOwner(event);
		addLocationCompatibility(populatedEvent);

		res.send({
			...populatedEvent,
			likeCount: likeCount || 0,
			likedByUser,
			commentCount: populatedComments.length,
			comments: populatedComments,
		});
	} catch (err) {
		res.status(500).send({ error: err.message });
	}
};

// Update an event
const updateEvent = async (req, res) => {
	const { title, description, date } = req.body;
	const legacyLocation = req.body?.location;
	const incomingLocation = normalizeEventLocation(req.body);

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

		if (existingEvent.owner_id !== req.user.id) {
			return res
				.status(403)
				.send({ error: 'You can only update events you own' });
		}

		// Build next location state (prefer request values, otherwise keep existing)
		let location_name =
			incomingLocation.location_name ?? existingEvent.location_name ?? null;
		let address = incomingLocation.address ?? existingEvent.address ?? null;
		let city = incomingLocation.city ?? existingEvent.city ?? null;
		let state = incomingLocation.state ?? existingEvent.state ?? null;
		let latitude =
			incomingLocation.latitude ?? existingEvent.latitude ?? null;
		let longitude =
			incomingLocation.longitude ?? existingEvent.longitude ?? null;

		// Only geocode if the request is attempting to change location, and we have something to geocode.
		const isLocationChanging =
			hasAnyLocationField(incomingLocation) ||
			legacyLocation !== undefined;

		if (isLocationChanging) {
			const geocodeBaseAddress = address || location_name;
			const shouldGeocode =
				!!geocodeBaseAddress &&
				(latitude === null ||
					latitude === undefined ||
					longitude === null ||
					longitude === undefined ||
					!address ||
					!city ||
					!state);

			if (shouldGeocode) {
				const geocodeResult = await geocodeAddress({
					address: geocodeBaseAddress,
					city,
					state,
				});

				if (geocodeResult.ok) {
					address = geocodeResult.data.address ?? address;
					city = geocodeResult.data.city ?? city;
					state = geocodeResult.data.state ?? state;
					latitude = geocodeResult.data.latitude ?? latitude;
					longitude = geocodeResult.data.longitude ?? longitude;
				} else {
					console.warn('Geocoding failed (updateEvent):', geocodeResult.error);
				}
			}
		}

		// Update the event
		const { data: event, error: updateError } = await supabase
			.from('events')
			.update({
				title: title || existingEvent.title,
				description: description || existingEvent.description,
				// Keep legacy location column for existing clients/DB constraints.
				location:
					legacyLocation ??
					(isLocationChanging
						? {
								name: location_name,
								address,
								city,
								state,
								latitude,
								longitude,
						  }
						: existingEvent.location),
				// New structured location fields
				location_name,
				address,
				city,
				state,
				latitude,
				longitude,
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

		// Populate owner info
		const populatedEvent = await populateOwner(eventWithDetails);
		addLocationCompatibility(populatedEvent);

		res.send(populatedEvent);
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

		// Populate owner info
		const populatedEvent = await populateOwner(eventWithDetails);
		addLocationCompatibility(populatedEvent);

		res.send(populatedEvent);
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
		if (event.owner_id === req.user.id) {
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

		// Populate owner info
		const populatedEvent = await populateOwner(eventWithDetails);
		addLocationCompatibility(populatedEvent);

		res.send(populatedEvent);
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

		if (event.owner_id !== req.user.id) {
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

// Get default locations
const getLocations = async (req, res) => {
	try {
		const { data: locations, error } = await supabase
			.from('locations')
			.select('id, name, address, city, state, country, latitude, longitude, zip')
			.order('name', { ascending: true });

		if (error) throw error;

		// Format locations for frontend display
		const formattedLocations = locations.map((location) => ({
			id: location.id,
			name: location.name,
			address: location.address,
			city: location.city,
			state: location.state,
			country: location.country,
			latitude: location.latitude,
			longitude: location.longitude,
			zip: location.zip,
			
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
			.select('id, owner_id, title')
			.eq('id', eventId)
			.single();

		if (fetchError || !event) {
			return res.status(404).json({ error: 'Event not found' });
		}

		// Insert comment with only user_id
		const { data: comment, error: insertError } = await supabase
			.from('event_comments')
			.insert([
				{
					event_id: eventId,
					user_id: user.id,
					text,
				},
			])
			.select()
			.single();

		if (insertError) throw insertError;

		// Populate user info
		const populatedComment = await populateUser(comment);

		// Fire-and-forget notification to event owner (do not block response)
		sendEventCommentNotification(event, comment, user).catch((e) => {
			console.error('Event comment notification failed:', e?.message || e);
		});

		res.status(201).json({ comment: populatedComment });
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
			.select('id, owner_id, title')
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

		if (existingComment.user_id !== user.id) {
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

		// Populate user info
		const populatedComment = await populateUser(updatedComment);

		res.status(200).json({ comment: populatedComment });
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
			.select('owner_id')
			.eq('id', eventId)
			.single();

		if (eventFetchError || !event) {
			return res.status(404).json({ error: 'Event not found' });
		}

		// Allow deletion if user is comment owner OR event owner
		const isCommentOwner = existingComment.user_id === user.id;
		const isEventOwner = event.owner_id === user.id;

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
			.eq('user_id', user.id)
			.single();

		if (existingLike) {
			return res.status(400).json({ error: 'You have already liked this event' });
		}

		// Insert the like with only user_id
		const { data: like, error: insertError } = await supabase
			.from('event_likes')
			.insert([
				{
					event_id: eventId,
					user_id: user.id,
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

		// Populate user info
		const populatedLike = await populateUser(like);

		// Fire-and-forget notification to event owner (do not block response)
		sendEventLikeNotification(event, like, user).catch((e) => {
			console.error('Event like notification failed:', e?.message || e);
		});

		res.status(201).json({ 
			message: 'Event liked successfully',
			like: populatedLike,
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
			.eq('user_id', user.id);

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
			.eq('user_id', user.id)
			.single();

		if (existingLike) {
			return res.status(400).json({ error: 'You have already liked this comment' });
		}

		// Insert the like with only user_id
		const { data: like, error: insertError } = await supabase
			.from('event_comment_likes')
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
			.from('event_comment_likes')
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
			.eq('user_id', user.id);

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
	getLocations,
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
