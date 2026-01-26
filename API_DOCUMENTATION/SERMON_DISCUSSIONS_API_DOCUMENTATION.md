# Sermon Discussions API Routes Documentation

This document shows how to make HTTP requests to each sermon discussion route in the theCollective server.

## Base URL

```
http://localhost:3000/API/v1/sermon-discussions
```

## Authentication

All routes require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

> Note: Discussions now accept either `sermonId` (preferred) referencing a `sermons` record or the legacy `sermonSeries` id. When available responses include a nested `sermon` object with basic sermon metadata.

---

## 1. Create Discussion

**POST** `/`

Create a new sermon discussion.

### Request

```javascript
// Using fetch API
fetch('/API/v1/sermon-discussions', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		Authorization: 'Bearer your-jwt-token',
	},
	body: JSON.stringify({
		title: 'How can we apply this message to our daily lives?',
		description:
			"Let's discuss practical ways to implement today's sermon in our everyday routines",
		sermonId: 'sermon-id',
		// optional: sermonSeries: 'series-id',
		weekNumber: 3,
		scriptureReferences: ['Matthew 5:14-16', 'James 2:14-26'],
		discussionQuestions: [
			'What does it mean to be a light in the world?',
			'How can we show our faith through our actions?',
		],
		status: 'active',
	}),
});
```

### cURL Example

```bash
curl -X POST \
  http://localhost:3000/API/v1/sermon-discussions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "title": "How can we apply this message to our daily lives?",
    "description": "Let'\''s discuss practical ways to implement today'\''s sermon in our everyday routines",
	"sermonId": "sermon-id",
	// "sermonSeries": "series-id",
    "weekNumber": 3,
    "scriptureReferences": [
      "Matthew 5:14-16",
      "James 2:14-26"
    ],
    "discussionQuestions": [
      "What does it mean to be a light in the world?",
      "How can we show our faith through our actions?"
    ],
    "status": "active"
  }'
```

### Request Body

- `title` (string, required): Discussion title
- `description` (string, required): Discussion description
- `sermonSeries` (string, required): ID of the associated sermon series
- `weekNumber` (number, required): Week number in the series
- `scriptureReferences` (array, optional): Array of scripture references
- `discussionQuestions` (array, optional): Array of discussion questions
- `status` (string, optional): Discussion status (default: 'active')

### Response

```json
{
	"status": "success",
	"data": {
		"id": "discussion-id",
		"title": "How can we apply this message to our daily lives?",
		"description": "Let's discuss practical ways to implement today's sermon in our everyday routines",
		"sermon_series_id": "series-id",
		"week_number": 3,
		"scripture_references": ["Matthew 5:14-16", "James 2:14-26"],
		"discussion_questions": [
			"What does it mean to be a light in the world?",
			"How can we show our faith through our actions?"
		],
		"status": "active",
		"discussion_date": "2024-01-01T00:00:00.000Z",
		"created_by": "user-id",
		"created_at": "2024-01-01T00:00:00.000Z",
		"updated_at": "2024-01-01T00:00:00.000Z",
		"created_by": {
			"name": "John Doe",
			"username": "johndoe",
			"email": "john@example.com"
		},
		"sermon_series": {
			"title": "Faith in Action"
		},
		"sermon": {
			"id": "sermon-id",
			"title": "Week 3 — Faith in Action",
			"speakers": [{ "name": "Guest Speaker" }],
			"summary": "Short sermon summary"
		},
		"sermon": {
			"id": "sermon-id",
			"title": "Week 3 — Faith in Action",
			"speakers": [
				{ "name": "Guest Speaker", "photo": "https://example.com/img.jpg" }
			],
			"summary": "A short summary of the sermon"
		}
	}
}
```

---

## 2. Get All Discussions

**GET** `/`

Get all sermon discussions with optional filtering.

### Request

```javascript
// Using fetch API with query parameters
fetch(
	'/API/v1/sermon-discussions?sermonSeries=series-id&weekNumber=3&status=active',
	{
		method: 'GET',
		headers: {
			Authorization: 'Bearer your-jwt-token',
		},
	},
);
```

### cURL Example

```bash
curl -X GET \
  "http://localhost:3000/API/v1/sermon-discussions?sermonSeries=series-id&weekNumber=3&status=active" \
  -H "Authorization: Bearer your-jwt-token"
```

### Query Parameters

- `sermonSeries` (string, optional): Filter by sermon series ID
- `weekNumber` (number, optional): Filter by week number
- `status` (string, optional): Filter by discussion status

### Response

```json
{
	"status": "success",
	"results": 2,
	"data": [
		{
			"id": "discussion-id-1",
			"title": "How can we apply this message to our daily lives?",
			"description": "Let's discuss practical ways to implement today's sermon in our everyday routines",
			"sermon_series_id": "series-id",
			"week_number": 3,
			"scripture_references": ["Matthew 5:14-16", "James 2:14-26"],
			"discussion_questions": [
				"What does it mean to be a light in the world?",
				"How can we show our faith through our actions?"
			],
			"status": "active",
			"discussion_date": "2024-01-01T00:00:00.000Z",
			"created_by": "user-id",
			"created_at": "2024-01-01T00:00:00.000Z",
			"updated_at": "2024-01-01T00:00:00.000Z",
			"created_by": {
				"name": "John Doe",
				"username": "johndoe",
				"email": "john@example.com"
			},
			"sermon_series": {
				"title": "Faith in Action"
			},
			"sermon": {
				"id": "sermon-id",
				"title": "Week 3 — Faith in Action",
				"speakers": [{ "name": "Guest Speaker" }],
				"summary": "Short sermon summary"
			},
			"comments": [
				{
					"id": "comment-id-1",
					"content": "This really spoke to my heart today",
					"created_at": "2024-01-01T12:00:00.000Z",
					"created_by": {
						"name": "Jane Smith",
						"email": "jane@example.com"
					}
				}
			]
		}
	]
}
```

---

## 3. Get Discussion by ID

**GET** `/:discussionId`

Get a specific discussion by ID with all comments.

### Request

```javascript
// Using fetch API
fetch('/API/v1/sermon-discussions/discussion-id', {
	method: 'GET',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X GET \
  http://localhost:3000/API/v1/sermon-discussions/discussion-id \
  -H "Authorization: Bearer your-jwt-token"
```

### Response

```json
{
	"status": "success",
	"data": {
		"id": "discussion-id",
		"title": "How can we apply this message to our daily lives?",
		"description": "Let's discuss practical ways to implement today's sermon in our everyday routines",
		"sermon_series_id": "series-id",
		"week_number": 3,
		"scripture_references": ["Matthew 5:14-16", "James 2:14-26"],
		"discussion_questions": [
			"What does it mean to be a light in the world?",
			"How can we show our faith through our actions?"
		],
		"status": "active",
		"discussion_date": "2024-01-01T00:00:00.000Z",
		"created_by": "user-id",
		"created_at": "2024-01-01T00:00:00.000Z",
		"updated_at": "2024-01-01T00:00:00.000Z",
		"created_by": {
			"name": "John Doe",
			"username": "johndoe",
			"email": "john@example.com"
		},
		"sermon_series": {
			"title": "Faith in Action"
		},
		"sermon": {
			"id": "sermon-id",
			"title": "Week 3 — Faith in Action",
			"speakers": [{ "name": "Guest Speaker" }],
			"summary": "Short sermon summary"
		},
		"comments": [
			{
				"id": "comment-id-1",
				"content": "This really spoke to my heart today",
				"created_at": "2024-01-01T12:00:00.000Z",
				"created_by": {
					"name": "Jane Smith",
					"email": "jane@example.com"
				}
			},
			{
				"id": "comment-id-2",
				"content": "I think we can start by being more intentional in our daily interactions",
				"created_at": "2024-01-01T14:30:00.000Z",
				"created_by": {
					"name": "Bob Johnson",
					"email": "bob@example.com"
				}
			}
		]
	}
}
```

---

## 4. Update Discussion

**PATCH** `/:discussionId`

Update a discussion (only the creator can update).

### Request

```javascript
// Using fetch API
fetch('/API/v1/sermon-discussions/discussion-id', {
	method: 'PATCH',
	headers: {
		'Content-Type': 'application/json',
		Authorization: 'Bearer your-jwt-token',
	},
	body: JSON.stringify({
		title: 'Updated Discussion Title',
		description: 'Updated description',
		status: 'completed',
		discussionQuestions: [
			'What does it mean to be a light in the world?',
			'How can we show our faith through our actions?',
			'What challenges do we face in living out our faith?',
		],
	}),
});
```

### cURL Example

```bash
curl -X PATCH \
  http://localhost:3000/API/v1/sermon-discussions/discussion-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "title": "Updated Discussion Title",
    "description": "Updated description",
    "status": "completed",
    "discussionQuestions": [
      "What does it mean to be a light in the world?",
      "How can we show our faith through our actions?",
      "What challenges do we face in living out our faith?"
    ]
  }'
```

### Request Body

- `title` (string, optional): Updated discussion title
- `description` (string, optional): Updated discussion description
- `sermonSeries` (string, optional): Updated sermon series ID
- `weekNumber` (number, optional): Updated week number
- `scriptureReferences` (array, optional): Updated scripture references
- `discussionQuestions` (array, optional): Updated discussion questions
- `status` (string, optional): Updated discussion status

### Response

```json
{
	"status": "success",
	"data": {
		"id": "discussion-id",
		"title": "Updated Discussion Title",
		"description": "Updated description",
		"sermon_series_id": "series-id",
		"week_number": 3,
		"scripture_references": ["Matthew 5:14-16", "James 2:14-26"],
		"discussion_questions": [
			"What does it mean to be a light in the world?",
			"How can we show our faith through our actions?",
			"What challenges do we face in living out our faith?"
		],
		"status": "completed",
		"discussion_date": "2024-01-01T00:00:00.000Z",
		"created_by": "user-id",
		"created_at": "2024-01-01T00:00:00.000Z",
		"updated_at": "2024-01-02T00:00:00.000Z",
		"created_by": {
			"name": "John Doe",
			"username": "johndoe",
			"email": "john@example.com"
		},
		"sermon_series": {
			"title": "Faith in Action"
		}
	}
}
```

---

## 5. Delete Discussion

**DELETE** `/:discussionId`

Delete a discussion (only the creator can delete).

### Request

```javascript
// Using fetch API
fetch('/API/v1/sermon-discussions/discussion-id', {
	method: 'DELETE',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X DELETE \
  http://localhost:3000/API/v1/sermon-discussions/discussion-id \
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

## 6. Add Comment

**POST** `/:discussionId/comments`

Add a comment to a discussion.

### Request

```javascript
// Using fetch API
fetch('/API/v1/sermon-discussions/discussion-id/comments', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		Authorization: 'Bearer your-jwt-token',
	},
	body: JSON.stringify({
		content:
			'This really spoke to my heart today. I think we can start by being more intentional in our daily interactions.',
	}),
});
```

### cURL Example

```bash
curl -X POST \
  http://localhost:3000/API/v1/sermon-discussions/discussion-id/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "content": "This really spoke to my heart today. I think we can start by being more intentional in our daily interactions."
  }'
```

### Request Body

- `content` (string, required): Comment content

### Response

```json
{
	"status": "success",
	"data": {
		"id": "comment-id",
		"content": "This really spoke to my heart today. I think we can start by being more intentional in our daily interactions.",
		"discussion_id": "discussion-id",
		"created_by": "user-id",
		"created_at": "2024-01-01T12:00:00.000Z",
		"updated_at": "2024-01-01T12:00:00.000Z",
		"created_by": {
			"name": "Jane Smith",
			"username": "janesmith",
			"email": "jane@example.com"
		}
	}
}
```

---

## 7. Update Comment

**PATCH** `/:discussionId/comments/:commentId`

Update a comment (only the creator can update).

### Request

```javascript
// Using fetch API
fetch('/API/v1/sermon-discussions/discussion-id/comments/comment-id', {
	method: 'PATCH',
	headers: {
		'Content-Type': 'application/json',
		Authorization: 'Bearer your-jwt-token',
	},
	body: JSON.stringify({
		content: 'Updated comment content with more thoughts on the topic.',
	}),
});
```

### cURL Example

```bash
curl -X PATCH \
  http://localhost:3000/API/v1/sermon-discussions/discussion-id/comments/comment-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "content": "Updated comment content with more thoughts on the topic."
  }'
```

### Request Body

- `content` (string, required): Updated comment content

### Response

```json
{
	"status": "success",
	"data": {
		"id": "comment-id",
		"content": "Updated comment content with more thoughts on the topic.",
		"discussion_id": "discussion-id",
		"created_by": "user-id",
		"created_at": "2024-01-01T12:00:00.000Z",
		"updated_at": "2024-01-01T15:30:00.000Z",
		"created_by": {
			"name": "Jane Smith",
			"username": "janesmith",
			"email": "jane@example.com"
		}
	}
}
```

---

## 8. Delete Comment

**DELETE** `/:discussionId/comments/:commentId`

Delete a comment (only the creator can delete).

### Request

```javascript
// Using fetch API
fetch('/API/v1/sermon-discussions/discussion-id/comments/comment-id', {
	method: 'DELETE',
	headers: {
		Authorization: 'Bearer your-jwt-token',
	},
});
```

### cURL Example

```bash
curl -X DELETE \
  http://localhost:3000/API/v1/sermon-discussions/discussion-id/comments/comment-id \
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
	"message": "You can only edit your own discussions"
}
```

### 404 Not Found

```json
{
	"status": "error",
	"message": "Discussion not found"
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

### Complete discussion management example:

```javascript
// Create a discussion
async function createDiscussion(discussionData) {
	try {
		const response = await fetch('/API/v1/sermon-discussions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
			body: JSON.stringify(discussionData),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Discussion created:', data);
		return data;
	} catch (error) {
		console.error('Error creating discussion:', error);
		throw error;
	}
}

// Get all discussions with filters
async function getAllDiscussions(filters = {}) {
	try {
		const queryParams = new URLSearchParams();

		if (filters.sermonSeries)
			queryParams.append('sermonSeries', filters.sermonSeries);
		if (filters.weekNumber)
			queryParams.append('weekNumber', filters.weekNumber);
		if (filters.status) queryParams.append('status', filters.status);

		const url = `/API/v1/sermon-discussions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

		const response = await fetch(url, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Discussions:', data);
		return data;
	} catch (error) {
		console.error('Error fetching discussions:', error);
		throw error;
	}
}

// Add a comment to a discussion
async function addComment(discussionId, content) {
	try {
		const response = await fetch(
			`/API/v1/sermon-discussions/${discussionId}/comments`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
				body: JSON.stringify({ content }),
			},
		);

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

// Update a comment
async function updateComment(discussionId, commentId, content) {
	try {
		const response = await fetch(
			`/API/v1/sermon-discussions/${discussionId}/comments/${commentId}`,
			{
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
				body: JSON.stringify({ content }),
			},
		);

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
async function deleteComment(discussionId, commentId) {
	try {
		const response = await fetch(
			`/API/v1/sermon-discussions/${discussionId}/comments/${commentId}`,
			{
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
			},
		);

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

// Example usage
const newDiscussion = {
	title: 'How can we apply this message to our daily lives?',
	description:
		"Let's discuss practical ways to implement today's sermon in our everyday routines",
	sermonSeries: 'series-id',
	weekNumber: 3,
	scriptureReferences: ['Matthew 5:14-16', 'James 2:14-26'],
	discussionQuestions: [
		'What does it mean to be a light in the world?',
		'How can we show our faith through our actions?',
	],
	status: 'active',
};

createDiscussion(newDiscussion)
	.then((result) => {
		console.log('Discussion created successfully:', result);
		// Add a comment to the discussion
		return addComment(result.data.id, 'This really spoke to my heart today!');
	})
	.then((comment) => {
		console.log('Comment added:', comment);
	})
	.catch((error) => {
		console.error('Error:', error);
	});
```

---

## Data Structure

### Discussion Object

```typescript
interface Discussion {
	id: string;
	title: string;
	description: string;
	sermon_series_id: string;
	week_number: number;
	scripture_references: string[];
	discussion_questions: string[];
	status: 'active' | 'completed' | 'archived';
	discussion_date: string;
	created_by: string;
	created_at: string;
	updated_at: string;
	created_by?: {
		name: string;
		username: string;
		email: string;
	};
	sermon_series?: {
		title: string;
	};
	comments?: Comment[];
}
```

### Comment Object

```typescript
interface Comment {
	id: string;
	content: string;
	discussion_id: string;
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

## Discussion Status Values

- `active`: Currently open for discussion
- `completed`: Discussion has concluded
- `archived`: Discussion is archived but still viewable

---

## Filtering and Search

The GET `/` endpoint supports several query parameters for filtering:

- **Sermon Series**: Filter by specific sermon series ID
- **Week Number**: Filter by week number in the series
- **Status**: Filter by discussion status
- **Results**: Ordered by created_at in descending order (newest first)
