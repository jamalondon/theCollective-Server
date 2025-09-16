# theCollective Server API Documentation

This is the complete API documentation for the theCollective server. The API provides endpoints for user management, events, prayer requests, sermon series, and discussions.

## Base URL

```
http://localhost:3000/API/v1
```

## Overview

The theCollective API is organized into several main modules:

- **Authentication** (`/auth`) - User registration, login, and verification
- **Users** (`/users`) - User profile management and activity tracking
- **Events** (`/events`) - Event creation, management, and attendance
- **Prayer Requests** (`/prayer-requests`) - Prayer request sharing and management
- **Sermon Series** (`/sermon-series`) - Sermon series management
- **Sermon Discussions** (`/sermon-discussions`) - Discussion threads and comments

## Quick Start

1. **Register a new user** using the authentication endpoints
2. **Get your JWT token** from the signin response
3. **Include the token** in the Authorization header for protected routes
4. **Start using the API** to manage events, prayer requests, and discussions

## Authentication

Most API endpoints require authentication. Include your JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Modules

### 1. Authentication API

Handles user registration, login, and phone verification.

**Base URL:** `/API/v1/auth`

**Endpoints:**
- `POST /signup` - Register with phone verification
- `POST /signup-no-phone` - Register without phone verification
- `POST /signin` - User login
- `POST /verify` - Verify JWT token
- `POST /start-verify` - Start phone verification
- `POST /check-verify` - Complete phone verification

**Documentation:** [AUTH_API_DOCUMENTATION.md](./AUTH_API_DOCUMENTATION.md)

---

### 2. User Management API

Manages user profiles, activity tracking, and user-specific data.

**Base URL:** `/API/v1/users`

**Endpoints:**
- `POST /upload-profile-picture` - Upload profile picture
- `GET /search` - Search users by name
- `GET /profile` - Get user profile with activity summary
- `GET /prayer-requests` - Get user's prayer requests
- `GET /prayer-comments` - Get prayer requests user commented on
- `GET /events` - Get user's events
- `GET /sermon-discussions` - Get user's sermon discussions

**Documentation:** [USER_API_DOCUMENTATION.md](./USER_API_DOCUMENTATION.md)

---

### 3. Events API

Manages church events, attendance, and scheduling.

**Base URL:** `/API/v1/events`

**Endpoints:**
- `POST /create` - Create new event
- `GET /` - Get all events
- `GET /my-events` - Get user's created events
- `GET /attending` - Get events user is attending
- `GET /locations/search` - Search event locations
- `GET /:id` - Get event by ID
- `PUT /:id/update` - Update event
- `POST /:id/attend` - Attend event
- `POST /:id/cancel` - Cancel attendance
- `DELETE /:id` - Delete event

**Documentation:** [EVENTS_API_DOCUMENTATION.md](./EVENTS_API_DOCUMENTATION.md)

---

### 4. Prayer Requests API

Manages prayer request sharing and community support.

**Base URL:** `/API/v1/prayer-requests`

**Endpoints:**
- `POST /` - Create prayer request with photos
- `GET /` - Get all prayer requests
- `DELETE /:id` - Delete prayer request

**Documentation:** [PRAYER_REQUESTS_API_DOCUMENTATION.md](./PRAYER_REQUESTS_API_DOCUMENTATION.md)

---

### 5. Sermon Series API

Manages sermon series and series information.

**Base URL:** `/API/v1/sermon-series`

**Endpoints:**
- `POST /` - Create sermon series
- `GET /` - Get all sermon series with filtering
- `GET /:seriesId` - Get series by ID
- `PATCH /:seriesId` - Update series
- `DELETE /:seriesId` - Delete series

**Documentation:** [SERMON_SERIES_API_DOCUMENTATION.md](./SERMON_SERIES_API_DOCUMENTATION.md)

---

### 6. Sermon Discussions API

Manages discussion threads and comments for sermon series.

**Base URL:** `/API/v1/sermon-discussions`

**Endpoints:**
- `POST /` - Create discussion
- `GET /` - Get all discussions with filtering
- `GET /:discussionId` - Get discussion by ID
- `PATCH /:discussionId` - Update discussion
- `DELETE /:discussionId` - Delete discussion
- `POST /:discussionId/comments` - Add comment
- `PATCH /:discussionId/comments/:commentId` - Update comment
- `DELETE /:discussionId/comments/:commentId` - Delete comment

**Documentation:** [SERMON_DISCUSSIONS_API_DOCUMENTATION.md](./SERMON_DISCUSSIONS_API_DOCUMENTATION.md)

---

## Common Response Formats

### Success Response

```json
{
	"status": "success",
	"data": { ... }
}
```

### Error Response

```json
{
	"status": "error",
	"message": "Error description"
}
```

### Pagination Response

```json
{
	"success": true,
	"data": [ ... ],
	"pagination": {
		"currentPage": 1,
		"totalPages": 5,
		"totalCount": 50,
		"hasNext": true,
		"hasPrev": false
	}
}
```

## Common HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting to prevent abuse. Rate limits are applied per IP address and may vary by endpoint.

## File Uploads

File uploads are supported for:
- Profile pictures (users)
- Prayer request photos (up to 5 per request)
- Sermon series cover images

Files are stored in Supabase Storage and accessible via public URLs.

## Environment Variables

The API requires the following environment variables:

- `JWT_SECRET` - Secret key for JWT token signing
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `TWILIO_ACCOUNT_SID` - Twilio account SID for SMS verification
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_VERIFY_SERVICE_SID` - Twilio Verify service SID

## Getting Started Examples

### 1. Register and Login

```javascript
// Register a new user
const signupResponse = await fetch('/API/v1/auth/signup-no-phone', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		username: 'johndoe',
		password: 'securePassword123',
		name: 'John Doe',
		dateOfBirth: '1990-01-01'
	})
});

const { token } = await signupResponse.json();

// Store token for future requests
localStorage.setItem('token', token);
```

### 2. Create an Event

```javascript
const eventResponse = await fetch('/API/v1/events/create', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${localStorage.getItem('token')}`
	},
	body: JSON.stringify({
		title: 'Sunday Service',
		description: 'Weekly worship service',
		location: 'Main Sanctuary',
		date: '2024-01-07T10:00:00Z',
		tags: ['worship', 'service']
	})
});

const event = await eventResponse.json();
```

### 3. Create a Prayer Request

```javascript
const formData = new FormData();
formData.append('text', 'Please pray for my family during this difficult time');
formData.append('title', 'Prayer for Family');
formData.append('anonymous', 'false');

const prayerResponse = await fetch('/API/v1/prayer-requests', {
	method: 'POST',
	headers: {
		'Authorization': `Bearer ${localStorage.getItem('token')}`
	},
	body: formData
});

const prayerRequest = await prayerResponse.json();
```

## Support

For API support or questions, please refer to the individual module documentation files or contact the development team.

## Changelog

- **v1.0.0** - Initial API release with all core modules
- Authentication with JWT tokens
- User management and profiles
- Event creation and attendance
- Prayer request sharing
- Sermon series management
- Discussion threads and comments
