# Authentication API Routes Documentation

This document shows how to make HTTP requests to each authentication route in the theCollective server.

## Base URL

```
http://localhost:3000/API/v1/auth
```

## Overview

Authentication routes handle user registration, login, and phone verification. Some routes require no authentication, while others require a valid JWT token.

---

## 1. User Signup (with phone)

**POST** `/signup`

Register a new user with phone number verification.

### Request

```javascript
// Using fetch API
fetch('/API/v1/auth/signup', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
	},
	body: JSON.stringify({
		username: 'johndoe',
		password: 'securePassword123',
		name: 'John Doe',
		dateOfBirth: '1990-01-01',
		phoneNumber: '+1234567890'
	}),
});
```

### cURL Example

```bash
curl -X POST \
  http://localhost:3000/API/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "securePassword123",
    "name": "John Doe",
    "dateOfBirth": "1990-01-01",
    "phoneNumber": "+1234567890"
  }'
```

### Request Body

- `username` (string, required): Unique username
- `password` (string, required): User password
- `name` (string, required): Full name
- `dateOfBirth` (string, required): Date of birth in YYYY-MM-DD format
- `phoneNumber` (string, required): Phone number with country code

### Response

```json
{
	"message": "User created successfully. Please verify your phone number.",
	"userID": "user-id",
	"username": "johndoe",
	"phoneNumber": "+1234567890"
}
```

---

## 2. User Signup (without phone)

**POST** `/signup-no-phone`

Register a new user without phone number verification.

### Request

```javascript
// Using fetch API
fetch('/API/v1/auth/signup-no-phone', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
	},
	body: JSON.stringify({
		username: 'johndoe',
		password: 'securePassword123',
		name: 'John Doe',
		dateOfBirth: '1990-01-01'
	}),
});
```

### cURL Example

```bash
curl -X POST \
  http://localhost:3000/API/v1/auth/signup-no-phone \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "securePassword123",
    "name": "John Doe",
    "dateOfBirth": "1990-01-01"
  }'
```

### Request Body

- `username` (string, required): Unique username
- `password` (string, required): User password
- `name` (string, required): Full name
- `dateOfBirth` (string, required): Date of birth in YYYY-MM-DD format

### Response

```json
{
	"token": "jwt-token-here",
	"userID": "user-id",
	"username": "johndoe",
	"name": "John Doe",
	"dateOfBirth": "1990-01-01",
	"profilePicture": "https://example.com/default-profile.jpg",
	"phoneNumber": null
}
```

---

## 3. User Signin

**POST** `/signin`

Authenticate user and return JWT token.

### Request

```javascript
// Using fetch API
fetch('/API/v1/auth/signin', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
	},
	body: JSON.stringify({
		username: 'johndoe',
		password: 'securePassword123'
	}),
});
```

### cURL Example

```bash
curl -X POST \
  http://localhost:3000/API/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "securePassword123"
  }'
```

### Request Body

- `username` (string, required): Username
- `password` (string, required): User password

### Response

#### Successful Login (no phone verification needed)
```json
{
	"token": "jwt-token-here",
	"userID": "user-id",
	"username": "johndoe",
	"name": "John Doe",
	"dateOfBirth": "1990-01-01",
	"profilePicture": "https://example.com/profile.jpg",
	"phoneNumber": "+1234567890"
}
```

#### Phone Verification Required
```json
{
	"verificationRequired": true,
	"username": "johndoe",
	"phoneNumber": "+1234567890",
	"userID": "user-id"
}
```

---

## 4. Verify Token

**POST** `/verify`

Verify a JWT token and return user information.

### Request

```javascript
// Using fetch API
fetch('/API/v1/auth/verify', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
	},
	body: JSON.stringify({
		token: 'jwt-token-here'
	}),
});
```

### cURL Example

```bash
curl -X POST \
  http://localhost:3000/API/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "jwt-token-here"
  }'
```

### Request Body

- `token` (string, required): JWT token to verify

### Response

```json
{
	"token": "jwt-token-here",
	"userID": "user-id",
	"username": "johndoe",
	"name": "John Doe",
	"dateOfBirth": "1990-01-01",
	"profilePicture": "https://example.com/profile.jpg",
	"phoneNumber": "+1234567890"
}
```

---

## 5. Start Phone Verification

**POST** `/start-verify`

Send SMS verification code to user's phone number.

### Request

```javascript
// Using fetch API
fetch('/API/v1/auth/start-verify', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
	},
	body: JSON.stringify({
		phoneNumber: '+1234567890'
	}),
});
```

### cURL Example

```bash
curl -X POST \
  http://localhost:3000/API/v1/auth/start-verify \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890"
  }'
```

### Request Body

- `phoneNumber` (string, required): Phone number with country code

### Response

```json
{
	"message": "Verification code sent to your phone number",
	"status": "pending"
}
```

---

## 6. Check Phone Verification

**POST** `/check-verify`

Verify the SMS code and complete phone verification.

### Request

```javascript
// Using fetch API
fetch('/API/v1/auth/check-verify', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
	},
	body: JSON.stringify({
		phoneNumber: '+1234567890',
		code: '123456'
	}),
});
```

### cURL Example

```bash
curl -X POST \
  http://localhost:3000/API/v1/auth/check-verify \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "code": "123456"
  }'
```

### Request Body

- `phoneNumber` (string, required): Phone number with country code
- `code` (string, required): 6-digit verification code

### Response

```json
{
	"token": "jwt-token-here",
	"userID": "user-id",
	"username": "johndoe",
	"name": "John Doe",
	"dateOfBirth": "1990-01-01",
	"profilePicture": "https://example.com/profile.jpg",
	"phoneNumber": "+1234567890"
}
```

---

## Error Responses

All routes may return these error responses:

### 400 Bad Request

```json
{
	"status": "error",
	"message": "Username already in use"
}
```

### 401 Unauthorized

```json
{
	"status": "error",
	"message": "Invalid username or password"
}
```

### 404 Not Found

```json
{
	"status": "error",
	"message": "No user found with this phone number"
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

### Complete authentication flow example:

```javascript
// Sign up a new user
async function signUp(username, password, name, dateOfBirth, phoneNumber) {
	try {
		const response = await fetch('/API/v1/auth/signup', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				username,
				password,
				name,
				dateOfBirth,
				phoneNumber
			}),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('User created:', data);
		return data;
	} catch (error) {
		console.error('Error signing up:', error);
		throw error;
	}
}

// Sign in user
async function signIn(username, password) {
	try {
		const response = await fetch('/API/v1/auth/signin', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				username,
				password
			}),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		
		// Check if phone verification is required
		if (data.verificationRequired) {
			console.log('Phone verification required');
			return { verificationRequired: true, ...data };
		}

		// Store token for future requests
		localStorage.setItem('token', data.token);
		console.log('Signed in successfully:', data);
		return data;
	} catch (error) {
		console.error('Error signing in:', error);
		throw error;
	}
}

// Verify phone number
async function verifyPhone(phoneNumber, code) {
	try {
		const response = await fetch('/API/v1/auth/check-verify', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				phoneNumber,
				code
			}),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		localStorage.setItem('token', data.token);
		console.log('Phone verified successfully:', data);
		return data;
	} catch (error) {
		console.error('Error verifying phone:', error);
		throw error;
	}
}

// Verify token
async function verifyToken(token) {
	try {
		const response = await fetch('/API/v1/auth/verify', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ token }),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Token verified:', data);
		return data;
	} catch (error) {
		console.error('Error verifying token:', error);
		throw error;
	}
}
```
