# Prayer Requests API Routes Documentation

This document shows how to make HTTP requests to each prayer request route in the theCollective server.

## Base URL

```
http://localhost:3000/API/v1/prayer-requests
```

## Authentication

Some routes require authentication. Include the JWT token in the Authorization header when needed:

```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Create Prayer Request

**POST** `/API/v1/prayer-requests`

Create a new prayer request with optional photos.

### Request

```javascript
// Using fetch API with FormData for file uploads
const formData = new FormData();
formData.append('text', 'Please pray for my family during this difficult time');
formData.append('title', 'Prayer for Family');
formData.append('anonymous', 'false');
formData.append('photos', fileInput.files[0]); // Optional photo
formData.append('photos', fileInput.files[1]); // Optional second photo

fetch('/API/v1/prayer-requests', {
	method: 'POST',
	headers: {
		'Authorization': 'Bearer your-jwt-token',
	},
	body: formData,
});
```



### Request Body (FormData)

- `text` (string, required): Prayer request text
- `title` (string, optional): Custom title (defaults to "Pray for [user name]")
- `anonymous` (string, optional): "true" or "false" (defaults to false)
- `photos` (file, optional): Up to 5 image files

### Response

```json
{
	"prayerRequest": {
		"id": "prayer-request-id",
		"owner": {
			"id": "user-id",
			"name": "John Doe",
			"profile_picture": "https://example.com/profile.jpg"
		},
		"comments": [],
		"photos": [
			"https://supabase-url/storage/v1/object/public/prayer-media/prayer-requests/user-id-timestamp_image1.jpg",
			"https://supabase-url/storage/v1/object/public/prayer-media/prayer-requests/user-id-timestamp_image2.jpg"
		],
		"text": "Please pray for my family during this difficult time",
		"title": "Prayer for Family",
		"anonymous": false,
		"created_at": "2024-01-01T00:00:00.000Z",
		"updated_at": "2024-01-01T00:00:00.000Z"
	}
}
```

---

## 2. Get All Prayer Requests

**GET** `/API/v1/prayer-requests`

Get all prayer requests (no authentication required).

### Response

```json
{
	"total": 25,
	"prayerRequests": [
		{
			"id": "prayer-request-id-1",
			"owner": {
				"id": "user-id-1",
				"name": "John Doe",
				"profile_picture": "https://example.com/profile1.jpg"
			},
			"comments": [
				{
					"id": "comment-id-1",
					"user_id": "user-id-2",
					"comment": "Praying for you and your family",
					"created_at": "2024-01-01T12:00:00.000Z"
				}
			],
			"photos": [
				"https://supabase-url/storage/v1/object/public/prayer-media/prayer-requests/user-id-timestamp_image1.jpg"
			],
			"text": "Please pray for my family during this difficult time",
			"title": "Prayer for Family",
			"anonymous": false,
			"created_at": "2024-01-01T00:00:00.000Z",
			"updated_at": "2024-01-01T00:00:00.000Z"
		},
		{
			"id": "prayer-request-id-2",
			"owner": {
				"id": "user-id-2",
				"name": "Anonymous",
				"profile_picture": "https://example.com/default-profile.jpg"
			},
			"comments": [],
			"photos": [],
			"text": "Please pray for healing and recovery",
			"title": "Pray for Anonymous",
			"anonymous": true,
			"created_at": "2024-01-02T00:00:00.000Z",
			"updated_at": "2024-01-02T00:00:00.000Z"
		}
	]
}
```

---

## 3. Delete Prayer Request

**DELETE** `/API/v1/prayer-requests/prayer-request-id`

Delete a prayer request (only the owner can delete).

### Response

```json
{
	"message": "Prayer request deleted successfully"
}
```

---

## Error Responses

All routes may return these error responses:

### 400 Bad Request

```json
{
	"error": "Prayer request text is required."
}
```

```json
{
	"error": "Comment text is required."
}
```

### 401 Unauthorized

```json
{
	"error": "Authentication required"
}
```

### 403 Forbidden

```json
{
	"error": "You can only delete your own prayer requests"
}
```

```json
{
	"error": "You can only edit your own comments"
}
```

```json
{
	"error": "You can only delete your own comments or comments on your prayer requests"
}
```

### 404 Not Found

```json
{
	"error": "Prayer request not found"
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

### Complete prayer request management example:

```javascript
// Create a prayer request
async function createPrayerRequest(text, title, anonymous = false, photos = []) {
	try {
		const formData = new FormData();
		formData.append('text', text);
		formData.append('title', title);
		formData.append('anonymous', anonymous.toString());
		
		// Add photos if provided
		photos.forEach((photo, index) => {
			formData.append('photos', photo);
		});

		const response = await fetch('/API/v1/prayer-requests', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${localStorage.getItem('token')}`,
			},
			body: formData,
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Prayer request created:', data);
		return data;
	} catch (error) {
		console.error('Error creating prayer request:', error);
		throw error;
	}
}

// Get all prayer requests
async function getAllPrayerRequests() {
	try {
		const response = await fetch('/API/v1/prayer-requests', {
			method: 'GET',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Prayer requests:', data);
		return data;
	} catch (error) {
		console.error('Error fetching prayer requests:', error);
		throw error;
	}
}

// Delete a prayer request
async function deletePrayerRequest(prayerRequestId) {
	try {
		const response = await fetch(`/API/v1/prayer-requests/${prayerRequestId}`, {
			method: 'DELETE',
			headers: {
				'Authorization': `Bearer ${localStorage.getItem('token')}`,
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Prayer request deleted:', data);
		return data;
	} catch (error) {
		console.error('Error deleting prayer request:', error);
		throw error;
	}
}

// Example usage with file input
function handleFileUpload(fileInput) {
	const files = Array.from(fileInput.files);
	
	createPrayerRequest(
		'Please pray for my family during this difficult time',
		'Prayer for Family',
		false,
		files
	).then(result => {
		console.log('Prayer request created with photos:', result);
	}).catch(error => {
		console.error('Failed to create prayer request:', error);
	});
}

// Example usage with anonymous prayer request
function createAnonymousPrayerRequest() {
	createPrayerRequest(
		'Please pray for healing and recovery',
		'Prayer for Healing',
		true
	).then(result => {
		console.log('Anonymous prayer request created:', result);
	}).catch(error => {
		console.error('Failed to create anonymous prayer request:', error);
	});
}

// =====================================================
// Comment Management Functions
// =====================================================

// Add a comment to a prayer request
async function addComment(prayerRequestId, text) {
	try {
		const response = await fetch(`/API/v1/prayer-requests/${prayerRequestId}/comments`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${localStorage.getItem('token')}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ text }),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Comment added:', data);
		return data;
	} catch (error) {
		console.error('Error adding comment:', error);
		throw error;
	}
}

// Get all comments for a prayer request
async function getComments(prayerRequestId) {
	try {
		const response = await fetch(`/API/v1/prayer-requests/${prayerRequestId}/comments`, {
			method: 'GET',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Comments:', data);
		return data;
	} catch (error) {
		console.error('Error fetching comments:', error);
		throw error;
	}
}

// Update a comment
async function updateComment(prayerRequestId, commentId, text) {
	try {
		const response = await fetch(`/API/v1/prayer-requests/${prayerRequestId}/comments/${commentId}`, {
			method: 'PUT',
			headers: {
				'Authorization': `Bearer ${localStorage.getItem('token')}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ text }),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Comment updated:', data);
		return data;
	} catch (error) {
		console.error('Error updating comment:', error);
		throw error;
	}
}

// Delete a comment
async function deleteComment(prayerRequestId, commentId) {
	try {
		const response = await fetch(`/API/v1/prayer-requests/${prayerRequestId}/comments/${commentId}`, {
			method: 'DELETE',
			headers: {
				'Authorization': `Bearer ${localStorage.getItem('token')}`,
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Comment deleted:', data);
		return data;
	} catch (error) {
		console.error('Error deleting comment:', error);
		throw error;
	}
}

// Example usage: Add a comment
addComment('prayer-request-uuid', 'Praying for you! 🙏')
	.then(result => console.log('Success:', result))
	.catch(error => console.error('Failed:', error));
```

---

## Data Structure

### Prayer Request Object

```typescript
interface PrayerRequest {
	id: string;
	owner: {
		id: string;
		name: string;
		profile_picture: string;
	};
	comments: Comment[];
	photos: string[];
	text: string;
	title: string;
	anonymous: boolean;
	created_at: string;
	updated_at: string;
}
```

### Comment Object

```typescript
interface Comment {
	id: string;
	prayer_request_id: string;
	user_id: string;
	text: string;
	created_at: string;
	updated_at: string;
	user: {
		id: string;
		name: string;
		profile_picture: string;
	};
}
```

---

## 4. Add Comment to Prayer Request

**POST** `/:id/comments`

Add a comment to a prayer request (authentication required).

### Request

```javascript
// Using fetch API
fetch('/API/v1/prayer-requests/prayer-request-id/comments', {
	method: 'POST',
	headers: {
		'Authorization': 'Bearer your-jwt-token',
		'Content-Type': 'application/json',
	},
	body: JSON.stringify({
		text: 'Praying for you and your family!',
	}),
});
```


### Response (201 Created)

```json
{
	"comment": {
		"id": "comment-uuid",
		"prayer_request_id": "prayer-request-uuid",
		"user_id": "user-uuid",
		"text": "Praying for you and your family!",
		"created_at": "2024-01-01T12:00:00.000Z",
		"updated_at": "2024-01-01T12:00:00.000Z",
		"user": {
			"id": "user-uuid",
			"name": "John Doe",
			"profile_picture": "https://example.com/profile.jpg"
		}
	}
}
```

---

## 5. Get Comments for Prayer Request

**GET** `/:id/comments`

Get all comments for a specific prayer request (no authentication required).

### Request

```javascript
// Using fetch API
fetch('/API/v1/prayer-requests/prayer-request-id/comments', {
	method: 'GET',
});
```


### Response (200 OK)

```json
{
	"total": 3,
	"comments": [
		{
			"id": "comment-uuid-1",
			"prayer_request_id": "prayer-request-uuid",
			"user_id": "user-uuid-1",
			"text": "Praying for you and your family!",
			"created_at": "2024-01-01T12:00:00.000Z",
			"updated_at": "2024-01-01T12:00:00.000Z",
			"user": {
				"id": "user-uuid-1",
				"name": "John Doe",
				"profile_picture": "https://example.com/profile1.jpg"
			}
		},
		{
			"id": "comment-uuid-2",
			"prayer_request_id": "prayer-request-uuid",
			"user_id": "user-uuid-2",
			"text": "Lifting you up in prayer 🙏",
			"created_at": "2024-01-01T13:00:00.000Z",
			"updated_at": "2024-01-01T13:00:00.000Z",
			"user": {
				"id": "user-uuid-2",
				"name": "Jane Smith",
				"profile_picture": "https://example.com/profile2.jpg"
			}
		}
	]
}
```

---

## 6. Update Comment

**PUT** `/:id/comments/:commentId`

Update a comment (only the comment owner can update).

### Request

```javascript
// Using fetch API
fetch('/API/v1/prayer-requests/prayer-request-id/comments/comment-id', {
	method: 'PUT',
	headers: {
		'Authorization': 'Bearer your-jwt-token',
		'Content-Type': 'application/json',
	},
	body: JSON.stringify({
		text: 'Updated comment text',
	}),
});
```



### Response (200 OK)

```json
{
	"comment": {
		"id": "comment-uuid",
		"prayer_request_id": "prayer-request-uuid",
		"user_id": "user-uuid",
		"text": "Updated comment text",
		"created_at": "2024-01-01T12:00:00.000Z",
		"updated_at": "2024-01-01T14:00:00.000Z",
		"user": {
			"id": "user-uuid",
			"name": "John Doe",
			"profile_picture": "https://example.com/profile.jpg"
		}
	}
}
```

---

## 7. Delete Comment

**DELETE** `/:id/comments/:commentId`

Delete a comment (comment owner or prayer request owner can delete).

### Request

```javascript
// Using fetch API
fetch('/API/v1/prayer-requests/prayer-request-id/comments/comment-id', {
	method: 'DELETE',
	headers: {
		'Authorization': 'Bearer your-jwt-token',
	},
});
```


### Response (200 OK)

```json
{
	"message": "Comment deleted successfully"
}
```

---

## File Upload Guidelines

- **Maximum files**: 5 photos per prayer request
- **Supported formats**: Common image formats (JPG, PNG, GIF, etc.)
- **Storage**: Files are stored in Supabase Storage under the `prayer-media` bucket
- **File naming**: Files are automatically renamed with timestamp to prevent conflicts
- **Public URLs**: Photos are accessible via public URLs for display

---

## Anonymous Prayer Requests

When creating an anonymous prayer request:
- The `owner.name` will be set to "Anonymous"
- The `owner.profile_picture` will use a default profile picture
- The `anonymous` field will be set to `true`
- The actual user ID is still stored for ownership verification
