# Sermon Series API Routes Documentation

This document shows how to make HTTP requests to each sermon series route in the theCollective server.

## Base URL

```
http://localhost:3000/API/v1/sermon-series
```

## Authentication

All routes require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Create Sermon Series

**POST** `/`

Create a new sermon series.

### Request

```javascript
// Using fetch API
fetch('/API/v1/sermon-series', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'Authorization': 'Bearer your-jwt-token',
	},
	body: JSON.stringify({
		title: 'Faith in Action',
		description: 'A series about living out our faith in daily life',
		startDate: '2024-01-07',
		endDate: '2024-02-25',
		numberOfWeeks: 8,
		coverImage: {
			url: 'https://example.com/series-cover.jpg',
			publicId: 'sermon-series/faith-in-action-cover'
		},
		status: 'active'
	}),
});
```

### cURL Example

```bash
curl -X POST \
  http://localhost:3000/API/v1/sermon-series \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "title": "Faith in Action",
    "description": "A series about living out our faith in daily life",
    "startDate": "2024-01-07",
    "endDate": "2024-02-25",
    "numberOfWeeks": 8,
    "coverImage": {
      "url": "https://example.com/series-cover.jpg",
      "publicId": "sermon-series/faith-in-action-cover"
    },
    "status": "active"
  }'
```

### Request Body

- `title` (string, required): Series title
- `description` (string, required): Series description
- `startDate` (string, required): Start date in YYYY-MM-DD format
- `endDate` (string, required): End date in YYYY-MM-DD format
- `numberOfWeeks` (number, required): Number of weeks in the series
- `coverImage` (object, required): Cover image details
  - `url` (string): Image URL
  - `publicId` (string): Public ID for the image
- `status` (string, optional): Series status (default: 'active')

### Response

```json
{
	"status": "success",
	"data": {
		"id": "series-id",
		"title": "Faith in Action",
		"description": "A series about living out our faith in daily life",
		"start_date": "2024-01-07T00:00:00.000Z",
		"end_date": "2024-02-25T00:00:00.000Z",
		"number_of_weeks": 8,
		"cover_image": {
			"url": "https://example.com/series-cover.jpg",
			"public_id": "sermon-series/faith-in-action-cover"
		},
		"status": "active",
		"created_by": "user-id",
		"created_at": "2024-01-01T00:00:00.000Z",
		"updated_at": "2024-01-01T00:00:00.000Z"
	}
}
```

---

## 2. Get All Sermon Series

**GET** `/`

Get all sermon series with optional filtering and search.

### Request

```javascript
// Using fetch API with query parameters
fetch('/API/v1/sermon-series?search=faith&status=active&startDate=2024-01-01', {
	method: 'GET',
	headers: {
		'Authorization': 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X GET \
  "http://localhost:3000/API/v1/sermon-series?search=faith&status=active&startDate=2024-01-01" \
  -H "Authorization: Bearer your-jwt-token"
```

### Query Parameters

- `search` (string, optional): Search in title and description
- `status` (string, optional): Filter by status
- `startDate` (string, optional): Filter by start date (YYYY-MM-DD)
- `endDate` (string, optional): Filter by end date (YYYY-MM-DD)

### Response

```json
{
	"status": "success",
	"results": 2,
	"data": [
		{
			"id": "series-id-1",
			"title": "Faith in Action",
			"description": "A series about living out our faith in daily life",
			"start_date": "2024-01-07T00:00:00.000Z",
			"end_date": "2024-02-25T00:00:00.000Z",
			"number_of_weeks": 8,
			"cover_image": {
				"url": "https://example.com/series-cover.jpg",
				"public_id": "sermon-series/faith-in-action-cover"
			},
			"status": "active",
			"created_by": "user-id",
			"created_at": "2024-01-01T00:00:00.000Z",
			"updated_at": "2024-01-01T00:00:00.000Z",
			"created_by": {
				"name": "John Doe",
				"username": "johndoe",
				"email": "john@example.com"
			}
		},
		{
			"id": "series-id-2",
			"title": "Love and Grace",
			"description": "Understanding God's love and grace in our lives",
			"start_date": "2024-03-03T00:00:00.000Z",
			"end_date": "2024-04-21T00:00:00.000Z",
			"number_of_weeks": 8,
			"cover_image": {
				"url": "https://example.com/love-grace-cover.jpg",
				"public_id": "sermon-series/love-grace-cover"
			},
			"status": "upcoming",
			"created_by": "user-id",
			"created_at": "2024-01-15T00:00:00.000Z",
			"updated_at": "2024-01-15T00:00:00.000Z",
			"created_by": {
				"name": "Jane Smith",
				"username": "janesmith",
				"email": "jane@example.com"
			}
		}
	]
}
```

---

## 3. Get Sermon Series by ID

**GET** `/:seriesId`

Get a specific sermon series by ID.

### Request

```javascript
// Using fetch API
fetch('/API/v1/sermon-series/series-id', {
	method: 'GET',
	headers: {
		'Authorization': 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X GET \
  http://localhost:3000/API/v1/sermon-series/series-id \
  -H "Authorization: Bearer your-jwt-token"
```

### Response

```json
{
	"status": "success",
	"data": {
		"id": "series-id",
		"title": "Faith in Action",
		"description": "A series about living out our faith in daily life",
		"start_date": "2024-01-07T00:00:00.000Z",
		"end_date": "2024-02-25T00:00:00.000Z",
		"number_of_weeks": 8,
		"cover_image": {
			"url": "https://example.com/series-cover.jpg",
			"public_id": "sermon-series/faith-in-action-cover"
		},
		"status": "active",
		"created_by": "user-id",
		"created_at": "2024-01-01T00:00:00.000Z",
		"updated_at": "2024-01-01T00:00:00.000Z",
		"created_by": {
			"name": "John Doe",
			"username": "johndoe",
			"email": "john@example.com"
		}
	}
}
```

---

## 4. Update Sermon Series

**PATCH** `/:seriesId`

Update a sermon series (only the creator can update).

### Request

```javascript
// Using fetch API
fetch('/API/v1/sermon-series/series-id', {
	method: 'PATCH',
	headers: {
		'Content-Type': 'application/json',
		'Authorization': 'Bearer your-jwt-token',
	},
	body: JSON.stringify({
		title: 'Updated Faith in Action',
		description: 'Updated description for the series',
		status: 'completed',
		coverImage: {
			url: 'https://example.com/new-cover.jpg',
			publicId: 'sermon-series/updated-faith-in-action-cover'
		}
	}),
});
```

### cURL Example

```bash
curl -X PATCH \
  http://localhost:3000/API/v1/sermon-series/series-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "title": "Updated Faith in Action",
    "description": "Updated description for the series",
    "status": "completed",
    "coverImage": {
      "url": "https://example.com/new-cover.jpg",
      "publicId": "sermon-series/updated-faith-in-action-cover"
    }
  }'
```

### Request Body

- `title` (string, optional): Updated series title
- `description` (string, optional): Updated series description
- `startDate` (string, optional): Updated start date in YYYY-MM-DD format
- `endDate` (string, optional): Updated end date in YYYY-MM-DD format
- `numberOfWeeks` (number, optional): Updated number of weeks
- `coverImage` (object, optional): Updated cover image details
- `status` (string, optional): Updated series status

### Response

```json
{
	"status": "success",
	"data": {
		"id": "series-id",
		"title": "Updated Faith in Action",
		"description": "Updated description for the series",
		"start_date": "2024-01-07T00:00:00.000Z",
		"end_date": "2024-02-25T00:00:00.000Z",
		"number_of_weeks": 8,
		"cover_image": {
			"url": "https://example.com/new-cover.jpg",
			"public_id": "sermon-series/updated-faith-in-action-cover"
		},
		"status": "completed",
		"created_by": "user-id",
		"created_at": "2024-01-01T00:00:00.000Z",
		"updated_at": "2024-01-02T00:00:00.000Z"
	}
}
```

---

## 5. Delete Sermon Series

**DELETE** `/:seriesId`

Delete a sermon series (only the creator can delete).

### Request

```javascript
// Using fetch API
fetch('/API/v1/sermon-series/series-id', {
	method: 'DELETE',
	headers: {
		'Authorization': 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X DELETE \
  http://localhost:3000/API/v1/sermon-series/series-id \
  -H "Authorization: Bearer your-jwt-token"
```

### Response

```json
{
	"status": "success",
	"data": null
}
```

---

## Error Responses

All routes may return these error responses:

### 400 Bad Request

```json
{
	"status": "error",
	"message": "Invalid request data"
}
```

### 401 Unauthorized

```json
{
	"status": "error",
	"message": "Authentication required"
}
```

### 403 Forbidden

```json
{
	"status": "error",
	"message": "You are not authorized to update this series"
}
```

### 404 Not Found

```json
{
	"status": "error",
	"message": "Sermon series not found"
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

### Complete sermon series management example:

```javascript
// Create a sermon series
async function createSermonSeries(seriesData) {
	try {
		const response = await fetch('/API/v1/sermon-series', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${localStorage.getItem('token')}`,
			},
			body: JSON.stringify(seriesData),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Sermon series created:', data);
		return data;
	} catch (error) {
		console.error('Error creating sermon series:', error);
		throw error;
	}
}

// Get all sermon series with filters
async function getAllSermonSeries(filters = {}) {
	try {
		const queryParams = new URLSearchParams();
		
		if (filters.search) queryParams.append('search', filters.search);
		if (filters.status) queryParams.append('status', filters.status);
		if (filters.startDate) queryParams.append('startDate', filters.startDate);
		if (filters.endDate) queryParams.append('endDate', filters.endDate);

		const url = `/API/v1/sermon-series${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${localStorage.getItem('token')}`,
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Sermon series:', data);
		return data;
	} catch (error) {
		console.error('Error fetching sermon series:', error);
		throw error;
	}
}

// Get a specific sermon series
async function getSermonSeries(seriesId) {
	try {
		const response = await fetch(`/API/v1/sermon-series/${seriesId}`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${localStorage.getItem('token')}`,
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Sermon series details:', data);
		return data;
	} catch (error) {
		console.error('Error fetching sermon series:', error);
		throw error;
	}
}

// Update a sermon series
async function updateSermonSeries(seriesId, updateData) {
	try {
		const response = await fetch(`/API/v1/sermon-series/${seriesId}`, {
			method: 'PATCH',
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
		console.log('Sermon series updated:', data);
		return data;
	} catch (error) {
		console.error('Error updating sermon series:', error);
		throw error;
	}
}

// Delete a sermon series
async function deleteSermonSeries(seriesId) {
	try {
		const response = await fetch(`/API/v1/sermon-series/${seriesId}`, {
			method: 'DELETE',
			headers: {
				'Authorization': `Bearer ${localStorage.getItem('token')}`,
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Sermon series deleted:', data);
		return data;
	} catch (error) {
		console.error('Error deleting sermon series:', error);
		throw error;
	}
}

// Example usage
const newSeries = {
	title: 'Faith in Action',
	description: 'A series about living out our faith in daily life',
	startDate: '2024-01-07',
	endDate: '2024-02-25',
	numberOfWeeks: 8,
	coverImage: {
		url: 'https://example.com/series-cover.jpg',
		publicId: 'sermon-series/faith-in-action-cover'
	},
	status: 'active'
};

createSermonSeries(newSeries)
	.then(result => {
		console.log('Series created successfully:', result);
	})
	.catch(error => {
		console.error('Failed to create series:', error);
	});
```

---

## Data Structure

### Sermon Series Object

```typescript
interface SermonSeries {
	id: string;
	title: string;
	description: string;
	start_date: string;
	end_date: string;
	number_of_weeks: number;
	cover_image: {
		url: string;
		public_id: string;
	};
	status: 'active' | 'upcoming' | 'completed' | 'cancelled';
	created_by: string;
	created_at: string;
	updated_at: string;
	created_by?: {
		name: string;
		username: string;
		email: string;
	};
}
```

---

## Series Status Values

- `active`: Currently running series
- `upcoming`: Series scheduled to start
- `completed`: Series that has finished
- `cancelled`: Series that was cancelled

---

## Search and Filtering

The GET `/` endpoint supports several query parameters for filtering and searching:

- **Search**: Searches in both title and description fields
- **Status**: Filter by series status
- **Date Range**: Filter by start and end dates
- **Results**: Ordered by start_date in descending order (newest first)
