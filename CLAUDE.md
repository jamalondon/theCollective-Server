# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

TheCollective-Server is an Express.js API backend for a church community platform. The API provides endpoints for authentication, events, sermons, sermon series, sermon discussions, prayer requests, Bible verses, notifications, and user management. The system uses Supabase for data persistence and authentication.

## Common Commands

### Development
- `npm run dev` - Start development server with auto-reload (uses nodemon)
- `npm run prod` - Start production server
- `npm test` - Run all tests (Jest)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Testing a Single Test File
- `npx jest path/to/test.test.js` - Run a specific test file
- `npx jest --testNamePattern="test name pattern"` - Run tests matching a pattern

## Architecture Overview

### Project Structure
```
src/
├── index.js              # Express app initialization, route mounting, error handling
├── supabase.js           # Supabase client configuration
├── supabaseSchemas.js    # Database schema definitions and RLS policies
├── controllers/          # Route logic and Supabase queries
├── routes/               # Route definitions and endpoint mounting
├── middlewares/          # Authentication, validation, error handling, logging
├── services/             # Business logic (notifications, etc.)
├── APIs/                 # External API integrations (Google, Bible APIs)
├── utils/                # Helper functions and utilities
└── tests/                # Test files (Jest)
```

### Key Architectural Patterns

#### MVC Pattern
- **Routes** (routes/) - HTTP endpoint definitions with method and path
- **Controllers** (controllers/) - Business logic, Supabase queries, data transformation
- **Middlewares** (middlewares/) - Authentication, validation, error handling

#### Authentication & Authorization
- **JWT-based**: Custom JWTs issued at login, verified in `requireAuth` middleware
- **Supabase**: Bypasses RLS using SERVICE_ROLE_KEY; custom JWT validation replaces RLS
- **Two middleware options**:
  - `requireAuth` - Mandatory authentication, 401 if missing/invalid token
  - `optionalAuth` - Allows unauthenticated access, populates req.user if valid token provided
- **User context**: Authenticated user available in `req.user` (from JWT payload and Supabase users table)

#### Error Handling
- **AppError class** (utils/AppError.js) - Custom operational errors with statusCode
- **catchAsync utility** (utils/catchAsync.js) - Wraps async functions to catch errors and pass to Express error handler
- **errorHandler middleware** (middlewares/errorHandler.js) - Centralized error response formatting
- Always use `next(new AppError(message, statusCode))` or `catchAsync()` to ensure errors reach the error handler

#### Input Validation
- **express-validator** - Validates and sanitizes request bodies before reaching controllers
- **Validator chains** in middlewares/validators/ - Each route has dedicated validators
- Validators run before controllers; invalid input returns 400 with error messages
- Example: authValidator.js validates signup/signin payloads

#### External API Integration
- **Google API** (APIs/GoogleAPI.js) - Handles Google services
- **Bible API** (APIs/BibleAPI.js) - Fetches Bible verses
- **Twilio** (utils/twilio.js) - SMS verification
- **Expo Push Notifications** (utils/expoPush.js) - Mobile push notifications

### Route Organization

Routes follow RESTful conventions:
- `/API/v1/auth` - Authentication (signup, signin, verification)
- `/API/v1/users` - User management
- `/API/v1/events` - Church events
- `/API/v1/sermon-series` - Sermon series CRUD
- `/API/v1/sermons` - Sermon CRUD
- `/API/v1/sermon-discussions` - Discussion threads for sermons
- `/API/v1/prayer-requests` - Prayer request management
- `/API/v1/bible` - Bible verse lookups
- `/API/v1/notifications` - Notification preferences and history

### Middleware Pipeline

Request flow in index.js:
1. Express JSON parser
2. Morgan logger (custom format with user context)
3. Cache clear middleware (populateUserInfo)
4. Route-specific validators (validate input)
5. requireAuth or optionalAuth (populate req.user)
6. Controller (business logic)
7. errorHandler (catch and format errors)

## Development Workflow

### Adding a New Route

1. **Create validator** (src/middlewares/validators/newValidator.js)
   - Use express-validator body() chains
   - End with validationResult check and next(new AppError(...))

2. **Create controller** (src/controllers/newController.js)
   - Import supabase client
   - Query Supabase tables
   - Transform and return data
   - Throw AppError for client errors

3. **Create route** (src/routes/newRoutes.js)
   - Import controller and validator
   - Define routes with app.get/post/put/delete
   - Mount validators before controller

4. **Mount route in index.js**
   - Add to routes array at top
   - Add app.use() to mount the router

5. **Write tests** (tests/newRoute.test.js)
   - Use supertest for API testing
   - Test happy path and error cases

### Handling User Context

```javascript
// In controllers - req.user is already populated by middleware
const userId = req.user.id;
const userEmail = req.user.email;
const userRole = req.user.role;

// Create records with user ownership
await supabase.from('prayer_requests').insert({
  created_by: userId,
  content: req.body.content
});
```

### Querying Supabase

```javascript
// SELECT with filters
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', id)
  .single(); // for single record

// INSERT
const { data, error } = await supabase
  .from('table_name')
  .insert({ field: value })
  .select();

// UPDATE
const { data, error } = await supabase
  .from('table_name')
  .update({ field: newValue })
  .eq('id', id)
  .select();

// DELETE
const { error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', id);

// Always check error; throw AppError if needed
if (error) {
  throw new AppError(`Failed to query: ${error.message}`, 500);
}
```

## Code Patterns & Standards

### Error Handling Pattern
```javascript
// Use AppError for operational errors
if (!user) {
  throw new AppError('User not found', 404);
}

// For invalid user input
throw new AppError('Invalid email format', 400);

// For server errors
if (error) {
  throw new AppError('Database error', 500);
}
```

### Async Route Handlers
- Wrap with `catchAsync()` to avoid try/catch boilerplate
- All errors thrown will be caught and passed to errorHandler
```javascript
router.post('/endpoint', catchAsync(async (req, res) => {
  // Errors thrown here are automatically caught
}));
```

### Validation Pattern
- Chain validators, always end with validationResult check
- Validators are middleware - they block the controller if validation fails
```javascript
const validateExample = [
  body('field').notEmpty().withMessage('Field is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array().map(e => e.msg).join(', '), 400));
    }
    next();
  }
];
```

## Testing Strategy

- **Test location**: tests/ directory (not src/)
- **Test file naming**: *.test.js (Jest looks for this pattern)
- **Framework**: Jest + Supertest
- **Coverage target**: src/**/*.js except index.js and test files

Sample test structure:
```javascript
const request = require('supertest');
const app = require('../src/index'); // Import Express app

describe('Auth Routes', () => {
  it('should signup a new user', async () => {
    const response = await request(app)
      .post('/API/v1/auth/signup')
      .send({ username: 'test', password: 'Test123!', ... });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();
  });
});
```

## Configuration & Environment

- **Base config**: config.js (holds database URIs)
- **.env file**: Use SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, NODE_ENV, PORT, API keys for Google/Twilio
- **NODE_ENV**: Controls logging verbosity and error detail
- **Schema validation**: See supabaseSchemas.js for RLS policies and table structures

## Important Implementation Details

### User Identification
- All tables using `created_by` field store the user's UUID (from auth.users.id)
- `req.user.id` is the authenticated user's UUID
- Some tables use RLS policies; SERVICE_ROLE_KEY bypasses them for server-side queries

### Sermon Series & Sermon Validation Logic
- See recent commits on sermon and sermon_series validation
- `created_by` and `rls` fields are required on both entities
- Validation enforces proper data structure before insertion

### Email & Phone Validation
- Email validation uses express-validator's isEmail()
- Phone validation uses E.164 format: `^\+[1-9]\d{1,14}$`
- Phone is optional in some endpoints (validateSignupNoPhone)

### Notifications
- Push notifications through Expo (uses push tokens stored in pushTokens table)
- SMS through Twilio (phone number validation required)
- Notification preferences allow users to opt-in/out

## Common Mistakes to Avoid

1. **Forgetting to populate req.user** - Always mount requireAuth or optionalAuth before controller
2. **Not checking Supabase errors** - Always check `if (error)` after queries
3. **Validation bypasses** - Always validate user input at the route level
4. **Async/await without error handling** - Use catchAsync() wrapper or proper try/catch
5. **Hardcoding user IDs** - Always use req.user.id from authenticated request
6. **Missing RLS checks** - Remember SERVICE_ROLE_KEY bypasses RLS; validate ownership in application code
7. **Storing credentials** - Never commit .env files or expose API keys in code

## Related Files to Review

- AGENT.md - Contains development philosophy and standards (Plan → Act → Reflect)
- POSTMAN_SETUP_GUIDE.md - API testing with Postman collections
- API_DOCUMENTATION/ - Detailed endpoint documentation
- package.json - Dependencies: Express, Supabase, JWT, Twilio, Google API, Expo, Bcrypt, Morgan, Express-validator, Multer
