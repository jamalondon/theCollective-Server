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

// Search for locations
router.get('/locations', eventController.getLocations);

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

// Event Comment Routes //

// Add a comment to an event
router.post('/:id/comments', eventController.addComment);

// Get all comments for an event
router.get('/:id/comments', eventController.getComments);

// Update a comment
router.put('/:id/comments/:commentId', eventController.updateComment);

// Delete a comment
router.delete('/:id/comments/:commentId', eventController.deleteComment);

// Event Like Routes //

// Like an event
router.post('/:id/like', eventController.likeEvent);

// Unlike an event
router.delete('/:id/like', eventController.unlikeEvent);

// Get likes for an event
router.get('/:id/likes', eventController.getEventLikes);

// Event Comment Like Routes //

// Like a comment
router.post('/:id/comments/:commentId/like', eventController.likeComment);

// Unlike a comment
router.delete('/:id/comments/:commentId/like', eventController.unlikeComment);

// Get likes for a comment
router.get('/:id/comments/:commentId/likes', eventController.getCommentLikes);

module.exports = router;
