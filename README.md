# URL Shortener API

A secure, RESTful backend API designed to convert long URLs into short, shareable identifiers, featuring user multi-tenancy and real-time click analytics. Built with Node.js, Express.js, and MongoDB.

## Features

- **User Authentication:** Secure registration and login using `bcryptjs` password hashing and stateful validation with JSON Web Tokens (JWT).
- **Link Generation:** Generates secure, unique 6-character short codes via `nanoid`.
- **Atomic Redirection:** A public proxy routing gateway that intercepts short link visits, records click metadata, and forwards the browser seamlessly.
- **Data Isolation:** User dashboard route dynamically partitioned via custom authorization middleware so accounts only query their own records.
- **Custom Network Resolution:** Configured entry-level DNS routing over Google and Cloudflare core lookup servers to bypass standard internet provider SRV routing constraints.

## Tech Stack

- **Runtime Environment:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB Atlas (Cloud Cluster)
- **ODM Layer:** Mongoose
- **Security:** JWT (JSON Web Tokens), Bcryptjs

## API Architecture & Endpoints

### 1. Authentication
- `POST /api/auth/register` — Register a new account (Name, Email, Password)
- `POST /api/auth/login` — Authenticate user credentials and receive a bearer token

### 2. URL Management (Protected)
*Requires `Authorization: Bearer <token>` Header*
- `POST /shorten` — Generate a custom short code for a submitted `longUrl`
- `GET /api/dashboard` — Fetch analytics and complete url document array for the authenticated user

### 3. Core Engine (Public)
- `GET /:shortCode` — Public redirect route that increments hit counters and performs an HTTP redirect to the original URL

## Local Installation Guide

1. Clone this repository to your workstation:
   ```bash
   git clone [https://github.com/YOUR-USERNAME/url-shortener-api.git](https://github.com/YOUR-USERNAME/url-shortener-api.git)