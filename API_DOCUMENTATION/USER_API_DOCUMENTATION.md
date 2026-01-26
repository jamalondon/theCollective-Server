# User API Routes Documentation

This document shows how to make HTTP requests to each user route in the theCollective server.

## Base URL

```
http://localhost:3000/api/users
```

## Authentication

All routes require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Upload Profile Picture

**POST** `/upload-profile-picture`

Upload a new profile picture for the authenticated user.

### Request

```javascript
// Using fetch API
const formData = new FormData();
formData.append('profilePicture', fileInput.files[0]);

fetch('/api/users/upload-profile-picture', {
	method: 'POST',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
	body: formData,
});
```

### cURL Example

```bash
curl -X POST \
  http://localhost:3000/api/users/upload-profile-picture \
  -H "Authorization: Bearer your-jwt-token" \
  -F "profilePicture=@/path/to/image.jpg"
```

### Response

```json
{
	"message": "Profile picture uploaded successfully",
	"profilePictureUrl": "https://supabase-url/storage/v1/object/public/user-profileimg/profile-pictures/user-id-timestamp.jpg"
}
```

---

## 2. Search Users

**GET** `/search?query=<search-term>`

Search for users by name.

### Request

```javascript
fetch('/api/users/search?query=john', {
	method: 'GET',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X GET \
  "http://localhost:3000/api/users/search?query=john" \
  -H "Authorization: Bearer your-jwt-token"
```

### Response

```json
{
	"success": true,
	"data": [
		{
			"id": "user-id-1",
			"name": "John Doe",
			"profile_picture": "https://example.com/profile1.jpg"
		},
		{
			"id": "user-id-2",
			"name": "Johnny Smith",
			"profile_picture": "https://example.com/profile2.jpg"
		}
	]
}
```

---

## 3. Get User Profile

**GET** `/profile` or `/profile/:userId`

Get comprehensive user profile with activity summary. If a `userId` parameter is provided, returns the profile of that specific user. Otherwise, returns the authenticated user's profile.

### URL Parameters

| Parameter | Type   | Required | Description                                                                 |
| --------- | ------ | -------- | --------------------------------------------------------------------------- |
| `userId`  | string | No       | The ID of the user to look up. If not provided, defaults to authenticated user. |

### Request (Own Profile)

```javascript
fetch('/api/users/profile', {
	method: 'GET',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
});
```

### Request (Specific User Profile)

```javascript
fetch('/api/users/profile/123e4567-e89b-12d3-a456-426614174000', {
	method: 'GET',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
});
```

### cURL Examples

```bash
# Get own profile
curl -X GET \
  http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer your-jwt-token"

# Get specific user's profile
curl -X GET \
  http://localhost:3000/api/users/profile/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer your-jwt-token"
```

### Response

```json
{
	"success": true,
	"user": {
		"id": "user-id",
		"username": "johndoe",
		"full_name": "John Doe",
		"profile_picture": "https://example.com/profile.jpg",
		"date_of_birth": "1990-01-01",
		"created_at": "2024-01-01T00:00:00Z"
	},
	"activitySummary": {
		"prayerRequestsCreated": 5,
		"prayerRequestsCommented": 12,
		"eventsAttended": 3,
		"sermonDiscussionsParticipated": 8,
		"eventsCreated": 2,
		"friends": 15
	}
}
```

### Error Responses

#### 404 Not Found

```json
{
	"status": "error",
	"message": "User not found"
}
```

---

## 4. Get User's Prayer Requests

**GET** `/prayer-requests?page=1&limit=10`

Get prayer requests created by the authenticated user.

### Request

```javascript
fetch('/api/users/prayer-requests?page=1&limit=10', {
	method: 'GET',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X GET \
  "http://localhost:3000/api/users/prayer-requests?page=1&limit=10" \
  -H "Authorization: Bearer your-jwt-token"
```

### Query Parameters

- `page` (optional): Page number, default: 1
- `limit` (optional): Items per page, default: 10

### Response

```json
{
	"success": true,
	"data": [
		{
			"id": "prayer-request-id",
			"title": "Prayer for healing",
			"description": "Please pray for my recovery...",
			"status": "active",
			"created_at": "2024-01-01T00:00:00Z",
			"updated_at": "2024-01-01T00:00:00Z",
			"is_anonymous": false,
			"prayer_count": 15
		}
	],
	"pagination": {
		"currentPage": 1,
		"totalPages": 3,
		"totalCount": 25,
		"hasNext": true,
		"hasPrev": false
	}
}
```

---

## 5. Get Prayer Requests User Commented On

**GET** `/prayer-comments?page=1&limit=10`

Get prayer requests the user has commented on.

### Request

```javascript
fetch('/api/users/prayer-comments?page=1&limit=10', {
	method: 'GET',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X GET \
  "http://localhost:3000/api/users/prayer-comments?page=1&limit=10" \
  -H "Authorization: Bearer your-jwt-token"
```

### Query Parameters

- `page` (optional): Page number, default: 1
- `limit` (optional): Items per page, default: 10

### Response

```json
{
	"success": true,
	"data": [
		{
			"id": "comment-id",
			"comment": "Praying for you!",
			"created_at": "2024-01-01T00:00:00Z",
			"prayer_requests": {
				"id": "prayer-request-id",
				"title": "Prayer for healing",
				"description": "Please pray for my recovery...",
				"status": "active",
				"user_id": "original-poster-id",
				"users": {
					"name": "Jane Smith",
					"profile_picture": "https://example.com/jane.jpg"
				}
			}
		}
	],
	"pagination": {
		"currentPage": 1,
		"totalPages": 2,
		"totalCount": 18,
		"hasNext": true,
		"hasPrev": false
	}
}
```

---

## 6. Get User's Events

**GET** `/events?page=1&limit=10&status=all`

Get events the user has attended or registered for.

### Request

```javascript
fetch('/api/users/events?page=1&limit=10&status=registered', {
	method: 'GET',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X GET \
  "http://localhost:3000/api/users/events?page=1&limit=10&status=attended" \
  -H "Authorization: Bearer your-jwt-token"
```

### Query Parameters

- `page` (optional): Page number, default: 1
- `limit` (optional): Items per page, default: 10
- `status` (optional): Filter by attendance status
  - `all` (default): All events
  - `registered`: Only registered events
  - `attended`: Only attended events
  - `cancelled`: Only cancelled registrations

### Response

```json
{
	"success": true,
	"data": [
		{
			"id": "attendance-id",
			"attendance_status": "attended",
			"registered_at": "2024-01-01T00:00:00Z",
			"events": {
				"id": "event-id",
				"title": "Sunday Service",
				"description": "Weekly worship service",
				"event_date": "2024-01-07",
				"start_time": "10:00:00",
				"end_time": "11:30:00",
				"location": "Main Sanctuary",
				"max_attendees": 200,
				"status": "completed"
			}
		}
	],
	"pagination": {
		"currentPage": 1,
		"totalPages": 1,
		"totalCount": 8,
		"hasNext": false,
		"hasPrev": false
	}
}
```

---

## 7. Get User's Sermon Discussions

**GET** `/sermon-discussions?page=1&limit=10`

Get sermon discussions the user has participated in.

### Request

```javascript
fetch('/api/users/sermon-discussions?page=1&limit=10', {
	method: 'GET',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X GET \
  "http://localhost:3000/api/users/sermon-discussions?page=1&limit=10" \
  -H "Authorization: Bearer your-jwt-token"
```

### Query Parameters

- `page` (optional): Page number, default: 1
- `limit` (optional): Items per page, default: 10

### Response

```json
{
	"success": true,
	"data": [
		{
			"id": "discussion-comment-id",
			"comment": "This really spoke to my heart...",
			"created_at": "2024-01-01T00:00:00Z",
			"sermon_discussions": {
				"id": "discussion-id",
				"question": "How can we apply this message to our daily lives?",
				"created_at": "2024-01-01T00:00:00Z",
				"sermon_series": {
					"id": "series-id",
					"title": "Faith in Action",
					"description": "A series about living out our faith",
					"series_image": "https://example.com/series-image.jpg"
				},
				"sermon": {
					"id": "sermon-id",
					"title": "Week 3 — Faith in Action",
					"speakers": [{ "name": "Guest Speaker" }],
					"summary": "Short sermon summary"
				}
			}
		}
	],
	"pagination": {
		"currentPage": 1,
		"totalPages": 2,
		"totalCount": 15,
		"hasNext": true,
		"hasPrev": false
	}
}
```

---

## 8. Get All Users

**GET** `/all-users?page=1&limit=20`

Get a paginated list of all users in the system.

### Request

```javascript
fetch('/api/users/all-users?page=1&limit=20', {
	method: 'GET',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X GET \
  "http://localhost:3000/api/users/all-users?page=1&limit=20" \
  -H "Authorization: Bearer your-jwt-token"
```

### Query Parameters

- `page` (optional): Page number, default: 1
- `limit` (optional): Items per page, default: 20

### Response

```json
{
	"success": true,
	"data": [
		{
			"id": "user-id-1",
			"username": "johndoe",
			"name": "John Doe",
			"profile_picture": "https://example.com/profile1.jpg",
			"date_of_birth": "1990-01-01",
			"created_at": "2024-01-01T00:00:00Z"
		},
		{
			"id": "user-id-2",
			"username": "janesmith",
			"name": "Jane Smith",
			"profile_picture": "https://example.com/profile2.jpg",
			"date_of_birth": "1992-05-15",
			"created_at": "2024-01-02T00:00:00Z"
		}
	],
	"pagination": {
		"currentPage": 1,
		"totalPages": 5,
		"totalCount": 100,
		"hasNext": true,
		"hasPrev": false
	}
}
```

---

## Error Responses

All routes may return these error responses:

### 401 Unauthorized

```json
{
	"status": "error",
	"message": "Authentication required"
}
```

### 400 Bad Request

```json
{
	"status": "error",
	"message": "Search query is required"
}
```

### 500 Internal Server Error

```json
{
	"status": "error",
	"message": "Internal server error"
}
```

---

## JavaScript Examples

### Complete fetch example with error handling:

```javascript
// Get own profile or a specific user's profile
async function getUserProfile(userId = null) {
	try {
		const url = userId
			? `/api/users/profile/${userId}`
			: '/api/users/profile';

		const response = await fetch(url, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('User profile:', data);
		return data;
	} catch (error) {
		console.error('Error fetching user profile:', error);
		throw error;
	}
}

// Usage examples:
// getUserProfile();                                      // Gets own profile
// getUserProfile('123e4567-e89b-12d3-a456-426614174000'); // Gets specific user's profile

async function uploadProfilePicture(file) {
	try {
		const formData = new FormData();
		formData.append('profilePicture', file);

		const response = await fetch('/api/users/upload-profile-picture', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
			body: formData,
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Profile picture uploaded:', data);
		return data;
	} catch (error) {
		console.error('Error uploading profile picture:', error);
		throw error;
	}
}
```
