# Bible API Documentation

This API provides access to Bible verses through the API.Bible service, including a daily verse feature and verse search functionality.

## Base URL
```
/API/v1/bible
```

## Authentication
- **Verse of the Day**: No authentication required (public endpoint)
- **Other endpoints**: Require valid JWT token in Authorization header

## Endpoints

### 1. Get Verse of the Day

**GET** `/verse-of-the-day`

Returns a consistent verse for the current day. The same verse will be returned for all requests on the same day.

#### Request
```http
GET /API/v1/bible/verse-of-the-day
```

#### Response
```json
{
  "status": "success",
  "data": {
    "verse": {
      "reference": "John 3:16",
      "content": "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
      "verseId": "JHN.3.16",
      "bibleId": "06125adad2d5898a-01",
      "date": "2024-11-14",
      "copyright": "ESV Text Edition: 2016. Copyright © 2001 by Crossway Bibles"
    }
  }
}
```

#### Status Codes
- `200 OK` - Success
- `404 Not Found` - Verse not found
- `401 Unauthorized` - Invalid API key
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

### 2. Get Specific Verse

**GET** `/verse/:reference`

Retrieve a specific Bible verse by reference.

#### Request
```http
GET /API/v1/bible/verse/JHN.3.16
Authorization: Bearer <your-jwt-token>
```

#### Parameters
- `reference` (string, required) - Bible verse reference in format like "JHN.3.16", "PSA.23", "1COR.13.4-8"

#### Response
```json
{
  "status": "success",
  "data": {
    "verse": {
      "reference": "John 3:16",
      "content": "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
      "verseId": "JHN.3.16",
      "bibleId": "06125adad2d5898a-01",
      "copyright": "ESV Text Edition: 2016. Copyright © 2001 by Crossway Bibles"
    }
  }
}
```

#### Status Codes
- `200 OK` - Success
- `400 Bad Request` - Missing verse reference
- `401 Unauthorized` - Invalid or missing JWT token
- `404 Not Found` - Verse not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

### 3. Search Verses

**GET** `/search`

Search for Bible verses containing specific text.

#### Request
```http
GET /API/v1/bible/search?query=love&limit=5
Authorization: Bearer <your-jwt-token>
```

#### Query Parameters
- `query` (string, required) - Search term or phrase
- `limit` (number, optional) - Maximum number of results (default: 10, max: 50)

#### Response
```json
{
  "status": "success",
  "results": 5,
  "data": {
    "verses": [
      {
        "reference": "1 John 4:19",
        "content": "We love because he first loved us.",
        "bibleId": "06125adad2d5898a-01"
      },
      {
        "reference": "John 3:16",
        "content": "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
        "bibleId": "06125adad2d5898a-01"
      }
    ]
  }
}
```

#### Status Codes
- `200 OK` - Success
- `400 Bad Request` - Missing search query
- `401 Unauthorized` - Invalid or missing JWT token
- `404 Not Found` - No verses found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Bible Version
All endpoints use the English Standard Version (ESV) by default.
- Bible ID: `06125adad2d5898a-01`

## Verse Reference Format
Verse references should follow the API.Bible format:
- Book abbreviations: `GEN`, `EXO`, `MAT`, `JHN`, `ROM`, etc.
- Chapter and verse: `JHN.3.16` (John 3:16)
- Verse ranges: `1COR.13.4-8` (1 Corinthians 13:4-8)
- Whole chapters: `PSA.23` (Psalm 23)

## Popular Verses Used for Verse of the Day
The system rotates through 31 popular Bible verses:
- Jeremiah 29:11
- Psalm 23
- 1 Corinthians 4:4-8
- Philippians 4:13
- John 3:16
- Romans 8:28
- Isaiah 41:10
- Psalm 46:1
- Galatians 5:22-23
- Hebrews 11:1
- 2 Timothy 1:7
- 1 Corinthians 10:13
- Proverbs 22:6
- Isaiah 40:31
- Joshua 1:9
- Hebrews 12:2
- Matthew 11:28
- Romans 10:9-10
- Philippians 2:3-4
- Matthew 5:43-44
- Psalm 119:105
- Ephesians 2:8-9
- 1 John 4:19
- Proverbs 3:5-6
- Matthew 6:26
- 2 Corinthians 5:17
- Psalm 139:14
- 1 Peter 5:7
- Romans 12:2
- James 1:17
- Psalm 37:4

## Environment Variables Required
Make sure to set the following environment variable in your `.env` file:
```
BIBLE_API_KEY=your_api_bible_key_here
```

You can get a free API key from [API.Bible](https://scripture.api.bible/).

## Rate Limiting
The API.Bible service has rate limits. The implementation includes proper error handling for rate limit responses (HTTP 429).

## Error Handling
All endpoints return consistent error responses:
```json
{
  "status": "error",
  "message": "Error description"
}
```

## CORS and Security
- The verse of the day endpoint is public and doesn't require authentication
- Other endpoints require valid JWT authentication
- All responses include appropriate CORS headers
