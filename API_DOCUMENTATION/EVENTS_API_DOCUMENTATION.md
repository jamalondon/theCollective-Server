# Events API Routes Documentation

This document shows how to make HTTP requests to each event route in the theCollective server.

## Base URL

```
http://localhost:3000/API/v1/events
```

## Authentication

All routes require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Create Event

**POST** `/create`

Create a new event.

### Request

```javascript
// Using fetch API
fetch('/API/v1/events/create', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'Authorization': 'Bearer your-jwt-token',
	},
	body: JSON.stringify({
		title: 'Sunday Service',
		description: 'Weekly worship service',
		location: 'Main Sanctuary',
		date: '2024-01-07T10:00:00Z',
		tags: ['worship', 'service']
	}),
});
```

### cURL Example

```bash
curl -X POST \
  http://localhost:3000/API/v1/events/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "title": "Sunday Service",
    "description": "Weekly worship service",
    "location": "Main Sanctuary",
    "date": "2024-01-07T10:00:00Z",
    "tags": ["worship", "service"]
  }'
```

### Request Body

- `title` (string, required): Event title
- `description` (string, required): Event description
- `location` (string, required): Event location
- `date` (string, required): Event date in ISO format
- `tags` (array, optional): Array of event tags

### Response

```json
{
	"id": "event-id",
	"title": "Sunday Service",
	"description": "Weekly worship service",
	"location": "Main Sanctuary",
	"date": "2024-01-07T10:00:00.000Z",
	"owner_id": "user-id",
	"tags": ["worship", "service"],
	"created_at": "2024-01-01T00:00:00.000Z",
	"updated_at": "2024-01-01T00:00:00.000Z",
	"owner": {
		"id": "user-id",
		"name": "John Doe",
		"username": "johndoe",
		"email": "john@example.com",
		"profile_picture": "https://example.com/profile.jpg"
	},
	"attendees": [
		{
			"user": {
				"id": "user-id",
				"name": "John Doe",
				"profile_picture": "https://example.com/profile.jpg"
			}
		}
	]
}
```

---

## 2. Get All Events

**GET** `/`

Get all events with owner information.

### Request

```javascript
// Using fetch API
fetch('/API/v1/events', {
	method: 'GET',
	headers: {
		'Authorization': 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X GET \
  http://localhost:3000/API/v1/events \
  -H "Authorization: Bearer your-jwt-token"
```

### Response

```json
[
	{
		"id": "event-id-1",
		"title": "Sunday Service",
		"description": "Weekly worship service",
		"location": "Main Sanctuary",
		"date": "2024-01-07T10:00:00.000Z",
		"owner_id": "user-id",
		"tags": ["worship", "service"],
		"created_at": "2024-01-01T00:00:00.000Z",
		"updated_at": "2024-01-01T00:00:00.000Z",
		"owner": {
			"id": "user-id",
			"name": "John Doe",
			"username": "johndoe",
			"email": "john@example.com",
			"profile_picture": "https://example.com/profile.jpg"
		}
	}
]
```

---

## 3. Get My Events

**GET** `/my-events`

Get events owned by the authenticated user.

### Request

```javascript
// Using fetch API
fetch('/API/v1/events/my-events', {
	method: 'GET',
	headers: {
		'Authorization': 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X GET \
  http://localhost:3000/API/v1/events/my-events \
  -H "Authorization: Bearer your-jwt-token"
```

### Response

```json
[
	{
		"id": "event-id",
		"title": "Sunday Service",
		"description": "Weekly worship service",
		"location": "Main Sanctuary",
		"date": "2024-01-07T10:00:00.000Z",
		"owner_id": "user-id",
		"tags": ["worship", "service"],
		"created_at": "2024-01-01T00:00:00.000Z",
		"updated_at": "2024-01-01T00:00:00.000Z",
		"owner": {
			"id": "user-id",
			"name": "John Doe",
			"username": "johndoe",
			"email": "john@example.com",
			"profile_picture": "https://example.com/profile.jpg"
		}
	}
]
```

---

## 4. Get Attending Events

**GET** `/attending`

Get events that the user is attending but not hosting.

### Request

```javascript
// Using fetch API
fetch('/API/v1/events/attending', {
	method: 'GET',
	headers: {
		'Authorization': 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X GET \
  http://localhost:3000/API/v1/events/attending \
  -H "Authorization: Bearer your-jwt-token"
```

### Response

```json
[
	{
		"id": "event-id",
		"title": "Bible Study",
		"description": "Weekly bible study group",
		"location": "Room 101",
		"date": "2024-01-08T19:00:00.000Z",
		"owner_id": "other-user-id",
		"tags": ["study", "bible"],
		"created_at": "2024-01-01T00:00:00.000Z",
		"updated_at": "2024-01-01T00:00:00.000Z",
		"owner": {
			"id": "other-user-id",
			"name": "Jane Smith",
			"username": "janesmith",
			"email": "jane@example.com",
			"profile_picture": "https://example.com/jane.jpg"
		}
	}
]
```

---

## 5. Search Locations

**GET** `/locations/search`

Search for event locations.

### Request

```javascript
// Using fetch API
fetch('/API/v1/events/locations/search', {
	method: 'GET',
	headers: {
		'Authorization': 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X GET \
  http://localhost:3000/API/v1/events/locations/search \
  -H "Authorization: Bearer your-jwt-token"
```

### Response

```json
[
	"Main Sanctuary",
	"Room 101",
	"Fellowship Hall",
	"Youth Room"
]
```

---

## 6. Get Event by ID

**GET** `/:id`

Get a specific event by ID with attendees.

### Request

```javascript
// Using fetch API
fetch('/API/v1/events/event-id', {
	method: 'GET',
	headers: {
		'Authorization': 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X GET \
  http://localhost:3000/API/v1/events/event-id \
  -H "Authorization: Bearer your-jwt-token"
```

### Response

```json
{
	"id": "event-id",
	"title": "Sunday Service",
	"description": "Weekly worship service",
	"location": "Main Sanctuary",
	"date": "2024-01-07T10:00:00.000Z",
	"owner_id": "user-id",
	"tags": ["worship", "service"],
	"created_at": "2024-01-01T00:00:00.000Z",
	"updated_at": "2024-01-01T00:00:00.000Z",
	"owner": {
		"id": "user-id",
		"name": "John Doe",
		"username": "johndoe",
		"email": "john@example.com",
		"profile_picture": "https://example.com/profile.jpg"
	},
	"attendees": [
		{
			"user": {
				"id": "user-id",
				"name": "John Doe",
				"profile_picture": "https://example.com/profile.jpg"
			}
		},
		{
			"user": {
				"id": "user-id-2",
				"name": "Jane Smith",
				"profile_picture": "https://example.com/jane.jpg"
			}
		}
	]
}
```

---

## 7. Update Event

**PUT** `/:id/update`

Update an event (only the owner can update).

### Request

```javascript
// Using fetch API
fetch('/API/v1/events/event-id/update', {
	method: 'PUT',
	headers: {
		'Content-Type': 'application/json',
		'Authorization': 'Bearer your-jwt-token',
	},
	body: JSON.stringify({
		title: 'Updated Sunday Service',
		description: 'Updated description',
		location: 'Main Sanctuary',
		date: '2024-01-07T10:00:00Z'
	}),
});
```

### cURL Example

```bash
curl -X PUT \
  http://localhost:3000/API/v1/events/event-id/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "title": "Updated Sunday Service",
    "description": "Updated description",
    "location": "Main Sanctuary",
    "date": "2024-01-07T10:00:00Z"
  }'
```

### Request Body

- `title` (string, optional): Updated event title
- `description` (string, optional): Updated event description
- `location` (string, optional): Updated event location
- `date` (string, optional): Updated event date in ISO format

### Response

```json
{
	"id": "event-id",
	"title": "Updated Sunday Service",
	"description": "Updated description",
	"location": "Main Sanctuary",
	"date": "2024-01-07T10:00:00.000Z",
	"owner_id": "user-id",
	"tags": ["worship", "service"],
	"created_at": "2024-01-01T00:00:00.000Z",
	"updated_at": "2024-01-01T00:00:00.000Z",
	"owner": {
		"id": "user-id",
		"name": "John Doe",
		"username": "johndoe",
		"email": "john@example.com",
		"profile_picture": "https://example.com/profile.jpg"
	},
	"attendees": [
		{
			"user": {
				"id": "user-id",
				"name": "John Doe",
				"profile_picture": "https://example.com/profile.jpg"
			}
		}
	]
}
```

---

## 8. Attend Event

**POST** `/:id/attend`

Add current user as an attendee to an event.

### Request

```javascript
// Using fetch API
fetch('/API/v1/events/event-id/attend', {
	method: 'POST',
	headers: {
		'Authorization': 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X POST \
  http://localhost:3000/API/v1/events/event-id/attend \
  -H "Authorization: Bearer your-jwt-token"
```

### Response

```json
{
	"message": "Successfully registered for event",
	"eventId": "event-id"
}
```

---

## 9. Cancel Attendance

**POST** `/:id/cancel`

Remove current user from event attendees.

### Request

```javascript
// Using fetch API
fetch('/API/v1/events/event-id/cancel', {
	method: 'POST',
	headers: {
		'Authorization': 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X POST \
  http://localhost:3000/API/v1/events/event-id/cancel \
  -H "Authorization: Bearer your-jwt-token"
```

### Response

```json
{
	"message": "Successfully cancelled attendance",
	"eventId": "event-id"
}
```

---

## 10. Delete Event

**DELETE** `/:id`

Delete an event (only the owner can delete).

### Request

```javascript
// Using fetch API
fetch('/API/v1/events/event-id', {
	method: 'DELETE',
	headers: {
		'Authorization': 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X DELETE \
  http://localhost:3000/API/v1/events/event-id \
  -H "Authorization: Bearer your-jwt-token"
```

### Response

```json
{
	"message": "Event deleted successfully"
}
```

---

## Error Responses

All routes may return these error responses:

### 401 Unauthorized

```json
{
	"error": "Authentication required"
}
```

### 403 Forbidden

```json
{
	"error": "You can only update events you own"
}
```

### 404 Not Found

```json
{
	"error": "Event not found"
}
```

### 409 Conflict

```json
{
	"error": "An event is already scheduled at this time and location"
}
```

### 422 Unprocessable Entity

```json
{
	"error": "You must provide all required event details"
}
```

### 500 Internal Server Error

```json
{
	"error": "Internal server error"
}
```

---

## JavaScript Examples

### Complete event management example:

```javascript
// Create a new event
async function createEvent(eventData) {
	try {
		const response = await fetch('/API/v1/events/create', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${localStorage.getItem('token')}`,
			},
			body: JSON.stringify(eventData),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Event created:', data);
		return data;
	} catch (error) {
		console.error('Error creating event:', error);
		throw error;
	}
}

// Get all events
async function getAllEvents() {
	try {
		const response = await fetch('/API/v1/events', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${localStorage.getItem('token')}`,
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Events:', data);
		return data;
	} catch (error) {
		console.error('Error fetching events:', error);
		throw error;
	}
}

// Attend an event
async function attendEvent(eventId) {
	try {
		const response = await fetch(`/API/v1/events/${eventId}/attend`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${localStorage.getItem('token')}`,
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Attendance confirmed:', data);
		return data;
	} catch (error) {
		console.error('Error attending event:', error);
		throw error;
	}
}

// Update an event
async function updateEvent(eventId, updateData) {
	try {
		const response = await fetch(`/API/v1/events/${eventId}/update`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${localStorage.getItem('token')}`,
			},
			body: JSON.stringify(updateData),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Event updated:', data);
		return data;
	} catch (error) {
		console.error('Error updating event:', error);
		throw error;
	}
}
```
