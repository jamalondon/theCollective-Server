# 🙏 The Collective Server

A RESTful API backend powering **The Collective** mobile app — a faith-based community platform that connects church members through prayer requests, events, sermon discussions, and more.

---

## 📖 Overview

The Collective Server provides the backend infrastructure for a church community mobile application. It enables users to:

- **Share Prayer Requests** — Post and support each other through prayer
- **Create & Join Events** — Organize church gatherings and community activities
- **Engage in Sermon Discussions** — Discuss sermons and share insights with the community
- **Manage Sermon Series** — Organize and access sermon content
- **Connect with Others** — Build meaningful relationships within the church community
- **Receive Notifications** — Stay updated on community activities

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | [Node.js](https://nodejs.org/) |
| **Framework** | [Express.js](https://expressjs.com/) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Authentication** | JWT (JSON Web Tokens) with Supabase Auth |
| **SMS Verification** | [Twilio](https://www.twilio.com/) |
| **AI Integration** | [Google GenAI](https://ai.google.dev/) |
| **File Uploads** | [Multer](https://github.com/expressjs/multer) |
| **Testing** | [Jest](https://jestjs.io/) + [Supertest](https://github.com/visionmedia/supertest) |

---

## 📁 Project Structure

```
theCollective-Server/
├── src/
│   ├── index.js              # Application entry point
│   ├── supabase.js           # Supabase client configuration
│   ├── APIs/                 # External API integrations
│   │   ├── BibleAPI.js
│   │   └── GoogleAPI.js
│   ├── controllers/          # Route handlers / business logic
│   ├── middlewares/          # Auth, validation, error handling
│   ├── routes/               # API route definitions
│   ├── services/             # Business services (notifications, etc.)
│   └── utils/                # Helper utilities
├── db/                       # Database migrations & docs
├── API_DOCUMENTATION/        # Detailed API documentation
├── postman/                  # Postman collection for testing
├── config.js                 # Environment configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher recommended)
- **npm** or **yarn**
- **Supabase account** with a configured project
- **Twilio account** (for SMS verification)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/theCollective-Server.git
cd theCollective-Server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create two environment files in the root directory:

**`.env.development`** (for local development):
```env
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# JWT
JWT_SECRET=your_jwt_secret

# Twilio (SMS Verification)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SID=your_twilio_verify_sid

# Google AI
GOOGLE_AI_API_KEY=your_google_ai_key

# Server
PORT=3000
```

**`.env.production`** (for production):
```env
# Same variables as above with production values
```

### 4. Start the Server

**Development mode** (with hot-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm run prod
```

The server will start on `http://localhost:3000` (or your configured PORT).

---

## 📡 API Endpoints

All API routes are prefixed with `/API/v1/`

| Module | Base Route | Description |
|--------|------------|-------------|
| **Auth** | `/auth` | User registration, login, phone verification |
| **Users** | `/users` | Profile management, activity tracking |
| **Events** | `/events` | Event creation and attendance |
| **Prayer Requests** | `/prayer-requests` | Prayer sharing and support |
| **Sermon Series** | `/sermon-series` | Sermon series management |
| **Sermon Discussions** | `/sermon-discussions` | Community discussions on sermons |
| **Sermons** | `/sermons` | Individual sermon content |
| **Bible** | `/bible` | Bible verses and references |
| **Notifications** | `/notifications` | Push notification preferences |

📚 **For detailed API documentation**, see the [API_DOCUMENTATION](./API_DOCUMENTATION) folder.

---

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** following our [coding guidelines](./AGENT.md)
4. **Write tests** for new functionality
5. **Commit your changes**: `git commit -m 'Add some feature'`
6. **Push to the branch**: `git push origin feature/your-feature-name`
7. **Open a Pull Request**

### Coding Guidelines

- Keep components and functions small and focused
- Comment generously — explain *why*, not just *what*
- Follow DRY principles — don't duplicate logic
- Use descriptive naming conventions
- Keep diffs small for easier code reviews

See [AGENT.md](./AGENT.md) for detailed coding standards.

---

## 📄 License

This project is licensed under the ISC License.

---

## 🙌 Acknowledgments

Built with ❤️ for The Collective church community.
