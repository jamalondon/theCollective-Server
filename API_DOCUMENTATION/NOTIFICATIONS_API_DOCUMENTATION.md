# Notifications API Documentation

This document describes the notification system API endpoints for theCollective server, including push notification preferences and user following functionality.

## Base URL

```
http://localhost:3000/API/v1
```

## Authentication

All notification endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Notification Preferences API

### 1. Get Notification Preferences

**GET** `/notifications/preferences`

Retrieve the current user's notification preferences.

#### Request

```javascript
fetch('/API/v1/notifications/preferences', {
	method: 'GET',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
});
```

#### Response (200 OK)

```json
{
	"status": "success",
	"data": {
		"preferences": {
			"notifications_enabled": true,
			"event_notifications": true,
			"prayer_notifications": true,
			"social_notifications": true,
			"updated_at": "2024-01-01T12:00:00.000Z"
		}
	}
}
```

---

### 2. Update Notification Preferences

**PUT** `/notifications/preferences`

Update the current user's notification preferences.

#### Request

```javascript
fetch('/API/v1/notifications/preferences', {
	method: 'PUT',
	headers: {
		'Content-Type': 'application/json',
		Authorization: 'Bearer your-jwt-token',
	},
	body: JSON.stringify({
		notifications_enabled: false,
		event_notifications: true,
		prayer_notifications: false,
		social_notifications: true,
	}),
});
```

#### Request Body

All fields are optional boolean values:

- `notifications_enabled` (boolean): Master notification toggle
- `event_notifications` (boolean): Event-related notifications
- `prayer_notifications` (boolean): Prayer request notifications
- `social_notifications` (boolean): Social interaction notifications (likes, comments)

**Note:** Setting `notifications_enabled` to `false` will automatically disable all category notifications.

#### Response (200 OK)

```json
{
	"status": "success",
	"message": "Notification preferences updated successfully",
	"data": {
		"preferences": {
			"notifications_enabled": false,
			"event_notifications": false,
			"prayer_notifications": false,
			"social_notifications": false,
			"updated_at": "2024-01-01T12:30:00.000Z"
		}
	}
}
```

#### Error Response (400 Bad Request)

```json
{
	"message": "notifications_enabled must be a boolean value"
}
```

---

### 3. Reset Notification Preferences

**POST** `/notifications/preferences/reset`

Reset notification preferences to default values (all enabled).

#### Request

```javascript
fetch('/API/v1/notifications/preferences/reset', {
	method: 'POST',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
});
```

#### Response (200 OK)

```json
{
	"status": "success",
	"message": "Notification preferences reset to defaults",
	"data": {
		"preferences": {
			"notifications_enabled": true,
			"event_notifications": true,
			"prayer_notifications": true,
			"social_notifications": true,
			"updated_at": "2024-01-01T13:00:00.000Z"
		}
	}
}
```

---

## User Following API

### 1. Follow a User

**POST** `/users/:userId/follow`

Follow another user to receive notifications when they create events.

#### Request

```javascript
fetch('/API/v1/users/user-id-to-follow/follow', {
	method: 'POST',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
});
```

#### Response (201 Created)

```json
{
	"status": "success",
	"message": "You are now following John Doe",
	"data": {
		"follow": {
			"id": "follow-uuid",
			"following": {
				"id": "user-uuid",
				"name": "John Doe",
				"username": "johndoe"
			},
			"created_at": "2024-01-01T12:00:00.000Z"
		}
	}
}
```

#### Error Response (400 Bad Request)

```json
{
	"message": "You are already following this user"
}
```

#### Error Response (404 Not Found)

```json
{
	"message": "User not found"
}
```

---

### 2. Unfollow a User

**DELETE** `/users/:userId/follow`

Stop following a user.

#### Request

```javascript
fetch('/API/v1/users/user-id-to-unfollow/follow', {
	method: 'DELETE',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
});
```

#### Response (200 OK)

```json
{
	"status": "success",
	"message": "Successfully unfollowed user"
}
```

#### Error Response (400 Bad Request)

```json
{
	"message": "You are not following this user"
}
```

---

### 3. Get User's Followers

**GET** `/users/:userId/followers`

Get a list of users who follow the specified user.

#### Request

```javascript
fetch('/API/v1/users/user-id/followers?page=1&limit=20', {
	method: 'GET',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
});
```

#### Query Parameters

- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)

#### Response (200 OK)

```json
{
	"status": "success",
	"data": {
		"user": {
			"id": "user-uuid",
			"name": "John Doe",
			"username": "johndoe"
		},
		"followers": [
			{
				"id": "follow-uuid-1",
				"user": {
					"id": "follower-uuid-1",
					"name": "Jane Smith",
					"username": "janesmith",
					"profile_picture": "https://example.com/profile1.jpg"
				},
				"followed_at": "2024-01-01T10:00:00.000Z"
			}
		],
		"pagination": {
			"page": 1,
			"limit": 20,
			"total": 1,
			"hasNext": false,
			"hasPrev": false
		}
	}
}
```

---

### 4. Get Users Following

**GET** `/users/:userId/following`

Get a list of users that the specified user is following.

#### Request

```javascript
fetch('/API/v1/users/user-id/following?page=1&limit=20', {
	method: 'GET',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
});
```

#### Query Parameters

- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)

#### Response (200 OK)

```json
{
	"status": "success",
	"data": {
		"user": {
			"id": "user-uuid",
			"name": "John Doe",
			"username": "johndoe"
		},
		"following": [
			{
				"id": "follow-uuid-1",
				"user": {
					"id": "following-uuid-1",
					"name": "Jane Smith",
					"username": "janesmith",
					"profile_picture": "https://example.com/profile1.jpg"
				},
				"followed_at": "2024-01-01T10:00:00.000Z"
			}
		],
		"pagination": {
			"page": 1,
			"limit": 20,
			"total": 1,
			"hasNext": false,
			"hasPrev": false
		}
	}
}
```

---

### 5. Check Follow Status

**GET** `/users/:userId/follow/status`

Check if the current user is following another user.

#### Request

```javascript
fetch('/API/v1/users/user-id/follow/status', {
	method: 'GET',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
});
```

#### Response (200 OK)

```json
{
	"status": "success",
	"data": {
		"is_following": true,
		"is_self": false,
		"followed_at": "2024-01-01T10:00:00.000Z"
	}
}
```

---

### 6. Get Follow Statistics

**GET** `/users/:userId/follow/stats`

Get follower and following counts for a user.

#### Request

```javascript
fetch('/API/v1/users/user-id/follow/stats', {
	method: 'GET',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
});
```

#### Response (200 OK)

```json
{
	"status": "success",
	"data": {
		"user": {
			"id": "user-uuid",
			"name": "John Doe",
			"username": "johndoe"
		},
		"stats": {
			"followers": 25,
			"following": 10
		}
	}
}
```

---

## Push Notification Payload Format

All push notifications sent by the system follow a standardized payload format:

### Notification Structure

```json
{
	"title": "User-friendly notification title",
	"body": "Notification body text",
	"sound": "default",
	"badge": 1,
	"data": {
		"route": "/event/123 | /prayer-request/456",
		"type": "event | prayer_request",
		"id": "resource-id",
		"actorId": "user-who-performed-action",
		"actionId": "like-id | comment-id (optional)"
	}
}
```

### Notification Types

#### 1. Event Created

- **Trigger**: When a user creates a new event
- **Recipients**: Followers of the event creator
- **Route**: `/event/{eventId}`

#### 2. Prayer Request Like

- **Trigger**: When someone likes a prayer request
- **Recipients**: Prayer request owner
- **Route**: `/prayer-request/{prayerRequestId}`

#### 3. Prayer Request Comment

- **Trigger**: When someone comments on a prayer request
- **Recipients**: Prayer request owner
- **Route**: `/prayer-request/{prayerRequestId}`

#### 4. Event Like

- **Trigger**: When someone likes an event
- **Recipients**: Event owner
- **Route**: `/event/{eventId}`

#### 5. Event Comment

- **Trigger**: When someone comments on an event
- **Recipients**: Event owner
- **Route**: `/event/{eventId}`

### Client Integration

The client app should handle the `data.route` field for deep-linking:

```javascript
// Example client-side handling
const handleNotification = (notification) => {
	const { route, type, id, actorId } = notification.data;

	// Navigate to the specified route
	navigation.navigate(route);

	// Or handle by type
	if (type === 'event') {
		navigation.navigate('EventDetail', { eventId: id });
	} else if (type === 'prayer_request') {
		navigation.navigate('PrayerRequestDetail', { prayerRequestId: id });
	}
};
```

---

## Database Schema

### User Notification Preferences Table

```sql
CREATE TABLE user_notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT true NOT NULL,
    event_notifications BOOLEAN DEFAULT true NOT NULL,
    prayer_notifications BOOLEAN DEFAULT true NOT NULL,
    social_notifications BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### User Followers Table

```sql
CREATE TABLE user_followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT no_self_follow CHECK (follower_id != following_id),
    CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);
```

### Enhanced Push Tokens Table

The existing `push_tokens` table has been enhanced with additional indexes and constraints for better performance and data integrity.

---

## Error Handling

All endpoints follow consistent error response formats:

### 400 Bad Request

```json
{
	"message": "Descriptive error message"
}
```

### 401 Unauthorized

```json
{
	"message": "Authentication required"
}
```

### 404 Not Found

```json
{
	"message": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
	"message": "Internal server error"
}
```

---

## Rate Limiting

Notification endpoints are subject to rate limiting to prevent abuse:

- Following/unfollowing: 10 requests per minute per user
- Preference updates: 5 requests per minute per user
- Read operations: 100 requests per minute per user

---

## Testing

The notification system includes comprehensive tests covering:

- Notification message building and validation
- Recipient selection logic
- Preference filtering
- Push token management
- API endpoint functionality

Run tests with:

```bash
npm test
npm run test:coverage
```
