# Sermons API Routes Documentation

This document shows how to make HTTP requests to the new `sermons` resource.

## Base URL

```
http://localhost:3000/API/v1/sermons
```

## Authentication

All routes require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Create Sermon

**POST** `/`

Create a new sermon record. `speakers`, `keyPoints` and `verses` are arrays. `speakers` supports either `{ "user_id": "<uuid>" }` or `{ "name": "...", "photo": "..." }` objects.

### Request

```javascript
fetch('/API/v1/sermons', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		Authorization: 'Bearer your-jwt-token',
	},
	body: JSON.stringify({
		title: 'Week 3 — Faith in Action',
		sermonSeries: 'series-id', // optional
		speakers: [
			{ user_id: 'user-uuid' },
			{ name: 'Guest', photo: 'https://...' },
		],
		summary: 'Short summary of sermon',
		keyPoints: ['Point A', 'Point B'],
		verses: ['John 3:16', 'Romans 8:28'],
	}),
});
```

### cURL Example

```bash
curl -X POST \
  http://localhost:3000/API/v1/sermons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "title": "Week 3 — Faith in Action",
    "sermonSeries": "series-id",
    "speakers": [{ "name": "Guest" }],
    "summary": "Short summary",
    "keyPoints": ["A","B"],
    "verses": ["John 3:16"]
  }'
```

### Request Body

- `title` (string, required)
- `sermonSeries` (string, optional) — parent series id
- `speakers` (array, optional) — array of speaker objects ({ user_id } or { name, photo })
- `summary` (string, optional)
- `keyPoints` (array, optional)
- `verses` (array, optional)

### Response

```json
{
	"status": "success",
	"data": {
		"id": "sermon-id",
		"title": "Week 3 — Faith in Action",
		"sermon_series_id": "series-id",
		"speakers": [{ "name": "Guest" }],
		"summary": "Short summary",
		"key_points": ["A", "B"],
		"verses": ["John 3:16"],
		"created_at": "2026-01-25T00:00:00.000Z"
	}
}
```

---

## 2. Get Sermons (list)

**GET** `/`

Query by `sermonSeries` or search by `title`.

### Example

`GET /API/v1/sermons?sermonSeries=series-id&title=faith`

---

## 3. Get Sermon by ID

**GET** `/:sermonId`

Returns the sermon record with `speakers`, `summary`, `key_points`, and `verses`.

---

## 4. Update Sermon

**PATCH** `/:sermonId`

Update sermon fields (only creator may update).

---

## 5. Delete Sermon

**DELETE** `/:sermonId`

Delete a sermon (only creator may delete).
