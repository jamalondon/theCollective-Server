# Friends API Documentation

## Overview
This API provides endpoints for managing friend relationships between users, including sending, accepting, rejecting friend requests, and managing friendships.

**Base URL:** `/API/v1/users`

**Authentication:** All endpoints require JWT Bearer token authentication.

---

## Table of Contents
1. [Send Friend Request](#1-send-friend-request)
2. [Accept Friend Request](#2-accept-friend-request)
3. [Reject Friend Request](#3-reject-friend-request)
4. [Cancel Friend Request](#4-cancel-friend-request)
5. [Remove Friend (Unfriend)](#5-remove-friend-unfriend)
6. [Get Friends List](#6-get-friends-list)
7. [Get Pending Friend Requests](#7-get-pending-friend-requests-received)
8. [Get Sent Friend Requests](#8-get-sent-friend-requests)
9. [Get Friendship Status](#9-get-friendship-status)

---

## Endpoints

### 1. Send Friend Request

Send a friend request to another user.

**Endpoint:** `POST /API/v1/users/friends/request`

**Authentication:** Required

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "ea0ad6ae-b14c-43c7-8925-3cd61f7be245"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Friend request sent successfully",
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "requester_id": "current-user-id",
    "addressee_id": "ea0ad6ae-b14c-43c7-8925-3cd61f7be245",
    "status": "pending",
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-15T10:30:00.000Z"
  }
}
```

**Special Case - Auto Accept (200 OK):**

If the target user already sent you a friend request, it will automatically be accepted:

```json
{
  "success": true,
  "message": "Friend request accepted",
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "requester_id": "ea0ad6ae-b14c-43c7-8925-3cd61f7be245",
    "addressee_id": "current-user-id",
    "status": "accepted",
    "created_at": "2025-01-15T10:25:00.000Z",
    "updated_at": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "status": "error",
  "message": "User ID is required"
}
```

```json
{
  "status": "error",
  "message": "You cannot send a friend request to yourself"
}
```

```json
{
  "status": "error",
  "message": "You are already friends with this user"
}
```

```json
{
  "status": "error",
  "message": "Friend request already sent"
}
```

**404 Not Found:**
```json
{
  "status": "error",
  "message": "User not found"
}
```

---

### 2. Accept Friend Request

Accept a pending friend request you received.

**Endpoint:** `PATCH /API/v1/users/friends/request/:friendshipId/accept`

**Authentication:** Required

**URL Parameters:**
- `friendshipId` (string, required) - The UUID of the friendship record

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Friend request accepted",
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "requester_id": "sender-user-id",
    "addressee_id": "current-user-id",
    "status": "accepted",
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-15T10:35:00.000Z"
  }
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "status": "error",
  "message": "Friend request not found"
}
```

---

### 3. Reject Friend Request

Reject a pending friend request you received.

**Endpoint:** `PATCH /API/v1/users/friends/request/:friendshipId/reject`

**Authentication:** Required

**URL Parameters:**
- `friendshipId` (string, required) - The UUID of the friendship record

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Friend request rejected",
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "requester_id": "sender-user-id",
    "addressee_id": "current-user-id",
    "status": "rejected",
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-15T10:35:00.000Z"
  }
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "status": "error",
  "message": "Friend request not found"
}
```

---

### 4. Cancel Friend Request

Cancel a pending friend request you sent.

**Endpoint:** `DELETE /API/v1/users/friends/request/:friendshipId/cancel`

**Authentication:** Required

**URL Parameters:**
- `friendshipId` (string, required) - The UUID of the friendship record

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Friend request cancelled"
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "status": "error",
  "message": "Friend request not found"
}
```

---

### 5. Remove Friend (Unfriend)

Remove a friend from your friends list.

**Endpoint:** `DELETE /API/v1/users/friends/:userId`

**Authentication:** Required

**URL Parameters:**
- `userId` (string, required) - The UUID of the friend to remove

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Friend removed successfully"
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "status": "error",
  "message": "User ID is required"
}
```

**404 Not Found:**
```json
{
  "status": "error",
  "message": "Friendship not found"
}
```

---

### 6. Get Friends List

Get a paginated list of all your friends.

**Endpoint:** `GET /API/v1/users/friends`

**Authentication:** Required

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (integer, optional) - Page number (default: 1)
- `limit` (integer, optional) - Items per page (default: 50, max: 100)

**Example Request:**
```
GET /API/v1/users/friends?page=1&limit=50
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ea0ad6ae-b14c-43c7-8925-3cd61f7be245",
      "username": "john_doe",
      "full_name": "John Doe",
      "profile_picture": "https://example.com/profiles/john.jpg",
      "created_at": "2024-01-01T08:00:00.000Z"
    },
    {
      "id": "b3c4d5e6-f789-0123-4567-89abcdef0123",
      "username": "jane_smith",
      "full_name": "Jane Smith",
      "profile_picture": "https://example.com/profiles/jane.jpg",
      "created_at": "2024-01-02T09:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalCount": 125,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Empty Response (200 OK):**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "currentPage": 1,
    "totalPages": 0,
    "totalCount": 0,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### 7. Get Pending Friend Requests (Received)

Get all pending friend requests you received from others.

**Endpoint:** `GET /API/v1/users/friends/requests/pending`

**Authentication:** Required

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (integer, optional) - Page number (default: 1)
- `limit` (integer, optional) - Items per page (default: 20)

**Example Request:**
```
GET /API/v1/users/friends/requests/pending?page=1&limit=20
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "requester_id": "ea0ad6ae-b14c-43c7-8925-3cd61f7be245",
      "addressee_id": "current-user-id",
      "status": "pending",
      "created_at": "2025-01-15T10:30:00.000Z",
      "updated_at": "2025-01-15T10:30:00.000Z",
      "requester": {
        "id": "ea0ad6ae-b14c-43c7-8925-3cd61f7be245",
        "username": "john_doe",
        "full_name": "John Doe",
        "profile_picture": "https://example.com/profiles/john.jpg",
        "created_at": "2024-01-01T08:00:00.000Z"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalCount": 3,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### 8. Get Sent Friend Requests

Get all pending friend requests you sent to others.

**Endpoint:** `GET /API/v1/users/friends/requests/sent`

**Authentication:** Required

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (integer, optional) - Page number (default: 1)
- `limit` (integer, optional) - Items per page (default: 20)

**Example Request:**
```
GET /API/v1/users/friends/requests/sent?page=1&limit=20
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "requester_id": "current-user-id",
      "addressee_id": "ea0ad6ae-b14c-43c7-8925-3cd61f7be245",
      "status": "pending",
      "created_at": "2025-01-15T10:30:00.000Z",
      "updated_at": "2025-01-15T10:30:00.000Z",
      "addressee": {
        "id": "ea0ad6ae-b14c-43c7-8925-3cd61f7be245",
        "username": "jane_smith",
        "full_name": "Jane Smith",
        "profile_picture": "https://example.com/profiles/jane.jpg",
        "created_at": "2024-01-02T09:00:00.000Z"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalCount": 2,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### 9. Get Friendship Status

Get the friendship status with a specific user.

**Endpoint:** `GET /API/v1/users/friends/status/:userId`

**Authentication:** Required

**URL Parameters:**
- `userId` (string, required) - The UUID of the user to check friendship status with

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Example Request:**
```
GET /API/v1/users/friends/status/ea0ad6ae-b14c-43c7-8925-3cd61f7be245
```

**Success Response - No Friendship (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "none"
  }
}
```

**Success Response - Checking Own Profile (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "self"
  }
}
```

**Success Response - Friendship Exists (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "accepted",
    "friendshipId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "isRequester": true,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Possible Status Values:**
- `none` - No friendship exists between users
- `self` - User is checking their own profile
- `pending` - Friend request is pending
- `accepted` - Users are friends
- `rejected` - Friend request was rejected
- `blocked` - One user has blocked the other

**Status Fields:**
- `status` (string) - The friendship status
- `friendshipId` (string) - UUID of the friendship record (if exists)
- `isRequester` (boolean) - True if current user sent the request, false if they received it
- `createdAt` (string) - When the friendship was created

**Error Responses:**

**400 Bad Request:**
```json
{
  "status": "error",
  "message": "User ID is required"
}
```

---

## Friendship Status Flow

```
1. User A sends friend request to User B
   └─> Status: "pending" (A is requester, B is addressee)

2. User B can:
   a) Accept the request
      └─> Status: "accepted" (both are now friends)
   
   b) Reject the request
      └─> Status: "rejected"
   
   c) Ignore (remains "pending")

3. User A can:
   - Cancel the request while it's "pending"
   - Cannot resend if rejected

4. Either user can:
   - Remove the friendship when status is "accepted"
   - This deletes the friendship record entirely
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "status": "error",
  "message": "Error description here"
}
```

**Common HTTP Status Codes:**
- `200` - OK (Success)
- `201` - Created (Friend request sent)
- `400` - Bad Request (Invalid input or business logic error)
- `401` - Unauthorized (Missing or invalid JWT token)
- `404` - Not Found (User or friendship not found)
- `500` - Internal Server Error

---

## Important Notes

### Bidirectional Relationships
The system handles friendships bidirectionally. Whether User A sends a request to User B or vice versa, they're considered the same friendship pair.

### Auto-Accept Feature
If User A sends a request to User B, but User B already has a pending request to User A, the existing request is automatically accepted, creating an instant friendship.

### Duplicate Prevention
Users cannot send multiple friend requests to the same user. The database enforces uniqueness at the friendship level.

### Self-Friendship Prevention
Users cannot send friend requests to themselves. This is enforced at both the application and database levels.

### Authentication
All endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Pagination
List endpoints (friends, pending requests, sent requests) support pagination to handle large datasets efficiently. Use `page` and `limit` query parameters.

---

## Example Usage

### Complete Friend Request Flow

#### 1. Search for a user
```bash
GET /API/v1/users/search?query=john
Authorization: Bearer <token>
```

#### 2. Send friend request
```bash
POST /API/v1/users/friends/request
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "ea0ad6ae-b14c-43c7-8925-3cd61f7be245"
}
```

#### 3. Check pending requests (as recipient)
```bash
GET /API/v1/users/friends/requests/pending
Authorization: Bearer <token>
```

#### 4. Accept the request
```bash
PATCH /API/v1/users/friends/request/f47ac10b-58cc-4372-a567-0e02b2c3d479/accept
Authorization: Bearer <token>
```

#### 5. View friends list
```bash
GET /API/v1/users/friends
Authorization: Bearer <token>
```

#### 6. Check friendship status
```bash
GET /API/v1/users/friends/status/ea0ad6ae-b14c-43c7-8925-3cd61f7be245
Authorization: Bearer <token>
```

#### 7. Remove friend (if needed)
```bash
DELETE /API/v1/users/friends/ea0ad6ae-b14c-43c7-8925-3cd61f7be245
Authorization: Bearer <token>
```

---

## Database Schema

### Friendships Table

```sql
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT no_self_friendship CHECK (requester_id != addressee_id),
    CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id)
);
```

**Indexes:**
- `idx_friendships_requester` on `requester_id`
- `idx_friendships_addressee` on `addressee_id`
- `idx_friendships_status` on `status`
- `idx_friendships_requester_status` on `(requester_id, status)`
- `idx_friendships_addressee_status` on `(addressee_id, status)`

**Helper Functions:**
- `are_friends(user1_id, user2_id)` - Check if two users are friends
- `get_friendship_status(user1_id, user2_id)` - Get friendship status
- `count_user_friends(user_uuid)` - Count user's total friends

---

## Security

### Row Level Security (RLS)

The friendships table has comprehensive RLS policies:

1. **View Policy:** Users can only see friendships where they are either requester or addressee
2. **Create Policy:** Users can only create friend requests as the requester
3. **Update Policy:** 
   - Addressees can accept/reject requests sent to them
   - Requesters can cancel pending requests they sent
4. **Delete Policy:** Users can delete friendships where they are involved

### Authentication
All endpoints are protected by the `requireAuth` middleware which validates JWT tokens.

---

## Testing

### Postman Collection

All friend management endpoints are available in the **"User Requests"** folder of the **"theCollective"** Postman collection.

**Environment Variables Required:**
- `Server-Public` - Your server URL (e.g., `http://localhost:3000`)
- `jwt_token` - Your JWT authentication token

### Test Scenarios

1. **Send Request to Non-Existent User** → Should return 404
2. **Send Request to Self** → Should return 400
3. **Send Duplicate Request** → Should return 400
4. **Accept Non-Existent Request** → Should return 404
5. **Mutual Request Auto-Accept** → Should return 200 with accepted status
6. **Remove Friend** → Should return 200
7. **Pagination** → Test with various page/limit values
8. **Friendship Status** → Test all status combinations

---

## Support

For issues or questions:
- **Backend Code:** `src/controllers/userController.js`
- **Routes:** `src/routes/userRoutes.js`
- **Database Migration:** `database/friendships_migration.sql`
- **Setup Guide:** `FRIENDS_SETUP.md`

---

**Version:** 1.0.0  
**Last Updated:** November 2025

