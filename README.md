# 🔗 URL Shortener

A full-stack web application for creating and managing shortened URLs with real-time click analytics. Built with Node.js/Express backend and vanilla JavaScript frontend, featuring secure user authentication and personal link dashboards.

## ✨ Features

- **🔐 User Authentication** — Secure registration and login with bcryptjs password hashing and JWT token validation
- **⚡ Link Generation** — Convert long URLs into shareable 6-character short codes via nanoid
- **📊 Click Analytics** — Track and display click counts for each shortened link
- **👤 User Dashboard** — Personal dashboard showing all user's shortened links with creation dates and statistics
- **🔄 Smart Redirection** — Public redirect system that increments click counters and seamlessly forwards to original URL
- **🔒 Data Isolation** — Multi-tenant architecture ensures users only access their own links
- **🌐 Cross-Origin Support** — Configured CORS for frontend-backend communication

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js 5.x
- **Database:** MongoDB Atlas (Cloud)
- **ODM:** Mongoose
- **Authentication:** JWT + HttpOnly Cookies
- **Password Security:** bcryptjs
- **ID Generation:** nanoid

### Frontend
- **HTML5** — Semantic markup
- **CSS3** — Modern styling with Tailwind-inspired design
- **Vanilla JavaScript** — No framework dependencies
- **Fetch API** — For async HTTP requests

## 📁 Project Structure

```
url-shortener/
├── server.js                 # Main Express server & API routes
├── models/
│   ├── user.js              # User schema & validation
│   └── url.js               # URL schema with click tracking
├── Public/                  # Frontend files (served statically)
│   ├── index.html          # Link creation page
│   ├── dashboard.html      # User dashboard with analytics
│   ├── login.html          # User login form
│   └── register.html       # User registration form
├── package.json             # Dependencies & scripts
├── .env                     # Environment variables (not in repo)
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (free tier available)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aqeeb05/url-shortener.git
   cd url-shortener
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/urlShortener?retryWrites=true&w=majority
   PORT=5000
   JWT_SECRET=your-secret-key-here-change-in-production
   ```

4. **Start the server**
   ```bash
   # Production
   npm start

   # Development (with auto-reload via nodemon)
   npm run dev
   ```

5. **Access the application**
   - Open `http://localhost:5500` in your browser (if using Live Server for frontend)
   - Or serve the `Public` folder on port 5500

## 📚 API Endpoints

### Authentication Routes

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully!"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure123"
}
```

**Response (200):**
```json
{
  "message": "Login successful!",
  "user": {
    "id": "userId",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```
*Sets HttpOnly cookie: `token`*

#### Logout User
```http
POST /api/auth/logout
```

**Response (200):**
```json
{
  "message": "Logged out Successfully"
}
```

### URL Management Routes (Protected)
*Requires valid JWT token in cookie*

#### Create Short Link
```http
POST /api/shorten
Content-Type: application/json
Cookie: token=<jwt-token>

{
  "longUrl": "https://github.com/aqeeb05/url-shortener"
}
```

**Response (200):**
```json
{
  "message": "Success! Saved to Database.",
  "shortCode": "abc123",
  "shortUrl": "http://localhost:5000/abc123"
}
```

#### Get User Dashboard
```http
GET /api/dashboard
Cookie: token=<jwt-token>
```

**Response (200):**
```json
{
  "user": {
    "username": "John Doe",
    "email": "john@example.com"
  },
  "count": 2,
  "urls": [
    {
      "_id": "urlId",
      "originalUrl": "https://github.com/aqeeb05",
      "shortCode": "abc123",
      "clicks": 5,
      "createdAt": "2026-08-15T10:30:00Z"
    }
  ]
}
```

### Public Routes

#### Redirect to Original URL
```http
GET /:shortCode
```

**Response:** Redirects to original URL with incremented click counter

## 🎯 Usage Examples

### 1. Register a New Account
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "email": "alice@example.com",
    "password": "password123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'
```

### 3. Shorten a URL
```bash
curl -X POST http://localhost:5000/api/shorten \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "longUrl": "https://www.example.com/very/long/url/path"
  }'
```

### 4. View Dashboard
```bash
curl -X GET http://localhost:5000/api/dashboard \
  -b cookies.txt
```

## 🔒 Security Features

- **Password Hashing:** bcryptjs with salt rounds (10)
- **JWT Tokens:** Secure, expiring tokens (7-day validity)
- **HttpOnly Cookies:** Token stored in secure, httpOnly cookies
- **CORS Protection:** Configured for specific origins
- **Input Validation:** Server-side validation on all routes
- **Custom DNS:** Google & Cloudflare DNS for reliability

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `PORT` | Server port number | `5000` |
| `JWT_SECRET` | Secret key for signing tokens | `your-secret-key` |

## 🔧 Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  createdAt: Date (default: now)
}
```

### URL Model
```javascript
{
  originalUrl: String (required),
  shortCode: String (required, unique),
  clicks: Number (default: 0),
  user: ObjectId (reference to User),
  createdAt: Date (default: now)
}
```

## 📋 Scripts

```bash
npm start          # Run production server
npm run dev        # Run development server with nodemon (auto-reload)
```

## 🐛 Troubleshooting

### "Failed to load dashboard"
- Ensure backend server is running on port 5000
- Check MongoDB connection string in `.env`
- Verify JWT token is valid and not expired

### "Cannot connect to MongoDB"
- Verify `MONGO_URI` in `.env` is correct
- Check MongoDB Atlas IP whitelist includes your machine
- Ensure MongoDB cluster is active

### "CORS error"
- Verify frontend is running on `http://localhost:5500`
- Update CORS origin in `server.js` if using different port

## 📸 Features Walkthrough

### User Registration & Login
1. Visit the registration page
2. Enter name, email, and password
3. Submit to create account
4. Login with credentials
5. Redirected to dashboard

### Create Shortened Link
1. On dashboard, click "+ New Link"
2. Paste long URL
3. Click "Shorten Link"
4. Copy generated short URL
5. Share with others

### Track Analytics
1. View dashboard anytime
2. See all created links
3. Track click count for each link
4. View creation date

## 🚢 Deployment

### Deploy to Heroku
```bash
heroku create your-app-name
git push heroku main
```

### Deploy Frontend to Vercel/Netlify
Upload the `Public` folder to your preferred hosting service.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👤 Author

**Aqeeb Ahmad**
- GitHub: [@aqeeb05](https://github.com/aqeeb05)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ❓ Support

For issues or questions, please open an issue on GitHub.