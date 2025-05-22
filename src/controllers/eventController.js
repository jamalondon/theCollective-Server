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
			.single();

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

		// Get the created event with owner details and attendees
		const { data: eventWithDetails, error: detailsError } = await supabase
			.from('events')
			.select(
				`
				*,
				owner:users!events_owner_id_fkey(name, email, profile_picture),
				attendees:event_attendees!inner(
					user:users!event_attendees_user_id_fkey(id, name, profile_picture)
				)
			`
			)
			.eq('id', event.id)
			.single();

		if (detailsError) throw detailsError;

		// Transform the response to match getAllEvents format
		const { owner_id, ...eventWithoutOwnerId } = eventWithDetails;
		const transformedEvent = {
			...eventWithoutOwnerId,
			owner: {
				...eventWithDetails.owner,
				id: owner_id,
			},
		};

		res.status(201).send(transformedEvent);
	} catch (err) {
		res.status(422).send({ error: err.message });
	}
};

// Get all events
const getAllEvents = async (req, res) => {
	try {
		const { data: events, error } = await supabase
			.from('events')
			.select(
				`
				*,
				owner:users!events_owner_id_fkey(name, email, profile_picture),
				attendees:event_attendees!inner(
					user:users!event_attendees_user_id_fkey(id, name, profile_picture)
				)
			`
			)
			.order('date', { ascending: true });

		if (error) throw error;

		// Transform the response to move owner_id into owner object
		const transformedEvents = events.map((event) => {
			const { owner_id, ...eventWithoutOwnerId } = event;
			return {
				...eventWithoutOwnerId,
				owner: {
					...event.owner,
					id: owner_id,
				},
			};
		});

		res.send(transformedEvents);
	} catch (err) {
		res.status(500).send({ error: err.message });
	}
};

// Get events owned by the current user
const getMyEvents = async (req, res) => {
	try {
		const { data: events, error } = await supabase
			.from('events')
			.select(
				`
				*,
				owner:users!events_owner_id_fkey(name, email),
				attendees:event_attendees!inner(
					user:users!event_attendees_user_id_fkey(id, name, profile_picture)
				)
			`
			)
			.eq('owner_id', req.user.id)
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
			.select(
				`
				*,
				owner:users!events_owner_id_fkey(name, email),
				attendees:event_attendees!inner(
					user:users!event_attendees_user_id_fkey(id, name, profile_picture)
				)
			`
			)
			.not('owner_id', 'eq', req.user.id)
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
				owner:users!events_owner_id_fkey(name, email),
				attendees:event_attendees!inner(
					user:users!event_attendees_user_id_fkey(id, name, profile_picture)
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

		if (existingEvent.owner_id !== req.user.id) {
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

		// Get the updated event with owner and attendees
		const { data: eventWithDetails, error: detailsError } = await supabase
			.from('events')
			.select(
				`
				*,
				owner:users!events_owner_id_fkey(name, email, profile_picture),
				attendees:event_attendees!inner(
					user:users!event_attendees_user_id_fkey(id, name, profile_picture)
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
			.single();

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

		// Get the updated event with owner details and attendees
		const { data: eventWithDetails, error: detailsError } = await supabase
			.from('events')
			.select(
				`
				*,
				owner:users!events_owner_id_fkey(name, email, profile_picture),
				attendees:event_attendees!inner(
					user:users!event_attendees_user_id_fkey(id, name, profile_picture)
				)
			`
			)
			.eq('id', req.params.id)
			.single();

		if (detailsError) throw detailsError;

		// Transform the response to match getAllEvents format
		const { owner_id, ...eventWithoutOwnerId } = eventWithDetails;
		const transformedEvent = {
			...eventWithoutOwnerId,
			owner: {
				...eventWithDetails.owner,
				id: owner_id,
			},
		};

		res.send(transformedEvent);
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

		// Get the updated event with owner details and attendees
		const { data: eventWithDetails, error: detailsError } = await supabase
			.from('events')
			.select(
				`
				*,
				owner:users!events_owner_id_fkey(name, email, profile_picture),
				attendees:event_attendees!inner(
					user:users!event_attendees_user_id_fkey(id, name, profile_picture)
				)
			`
			)
			.eq('id', req.params.id)
			.single();

		if (detailsError) throw detailsError;

		// Transform the response to match getAllEvents format
		const { owner_id, ...eventWithoutOwnerId } = eventWithDetails;
		const transformedEvent = {
			...eventWithoutOwnerId,
			owner: {
				...eventWithDetails.owner,
				id: owner_id,
			},
		};

		res.send(transformedEvent);
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
};
