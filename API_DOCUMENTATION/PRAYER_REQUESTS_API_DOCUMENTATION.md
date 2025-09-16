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

**POST** `/`

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

### cURL Example

```bash
curl -X POST \
  http://localhost:3000/API/v1/prayer-requests \
  -H "Authorization: Bearer your-jwt-token" \
  -F "text=Please pray for my family during this difficult time" \
  -F "title=Prayer for Family" \
  -F "anonymous=false" \
  -F "photos=@/path/to/image1.jpg" \
  -F "photos=@/path/to/image2.jpg"
```

### Request Body (FormData)

- `text` (string, required): Prayer request text content
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

**GET** `/`

Get all prayer requests (no authentication required).

### Request

```javascript
// Using fetch API
fetch('/API/v1/prayer-requests', {
	method: 'GET',
});
```

### cURL Example

```bash
curl -X GET \
  http://localhost:3000/API/v1/prayer-requests
```

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

**DELETE** `/:id`

Delete a prayer request (only the owner can delete).

### Request

```javascript
// Using fetch API
fetch('/API/v1/prayer-requests/prayer-request-id', {
	method: 'DELETE',
	headers: {
		'Authorization': 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X DELETE \
  http://localhost:3000/API/v1/prayer-requests/prayer-request-id \
  -H "Authorization: Bearer your-jwt-token"
```

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
	user_id: string;
	comment: string;
	created_at: string;
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
