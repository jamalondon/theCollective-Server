const express = require('express');
const requireAuth = require('../middlewares/requireAuth');
const eventController = require('../controllers/eventController');

const router = express.Router();

// Middleware to protect all event routes
router.use(requireAuth);

// Create a new event
router.post('/create', eventController.createEvent);

// Get all events
router.get('/', eventController.getAllEvents);

// Get events owned by the current user
router.get('/my-events', eventController.getMyEvents);

// Get events that the user is attending but not hosting
router.get('/attending', eventController.getAttendingEvents);

// Search for users
router.get('/users/search', eventController.searchUsers);

// Search for locations
router.get('/locations/search', eventController.searchLocations);

// Get a specific event by ID
router.get('/:id', eventController.getEventById);

// Update an event (only the owner can update)
router.put('/:id/update', eventController.updateEvent);

// Add current user as an attendee
router.post('/:id/attend', eventController.attendEvent);

// Remove current user from attendees
router.post('/:id/cancel', eventController.cancelAttendance);

// Delete an event (only the owner can delete)
router.delete('/:id', eventController.deleteEvent);

module.exports = router;
