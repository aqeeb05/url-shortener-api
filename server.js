const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); // Forces Node.js to use Google and Cloudflare DNS directly
require('dotenv').config(); // Load our secret keys from the .env file
const express = require('express');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Url = require('./models/Url'); // Import our database blueprint
const User = require('./models/User'); // Import our User database blueprint


const app = express();
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Database connected successfully to MongoDB Atlas!'))
    .catch(err => console.error('Database connection error:', err));

// ==========================================
// USER AUTHENTICATION ENDPOINTS
// ==========================================

// 1. REGISTER USER: Hashes password and saves account to the cloud
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Please enter all fields' });
    }

    try {
        // Check if user already exists
        let userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: 'A user with this email already exists' });
        }

        // Hash the password for security
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create and save user
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// 2. LOGIN USER: Verifies credentials and hands out a JWT token
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide email and password' });
    }

    try {
        // Look up the user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Compare the submitted password with the encrypted hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Create a secure JSON Web Token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // Token remains active for 1 week
        );

        res.json({
            message: 'Login successful!',
            token: token,
            user: { id: user._id, name: user.name, email: user.email }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// ==========================================
// AUTHENTICATION MIDDLEWARE (The Gatekeeper)
// ==========================================
const authMiddleware = (req, res, next) => {
    // Get the token from the request header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'No token provided, authorization denied' });
    }

    try {
        // Verify the token signature using our secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach the logged-in user's ID directly to the request object
        req.userId = decoded.userId;
        
        next(); // Move on to the actual route handler logic
    } catch (error) {
        res.status(401).json({ error: 'Token is invalid or expired' });
    }
};

// 1. SHORTEN ROUTE: Saves link permanently to the cloud database
app.post('/shorten', authMiddleware, async (req, res) => {
    const { longUrl } = req.body;

    if (!longUrl) {
        return res.status(400).json({ error: 'Please provide a longUrl' });
    }

    try {
        const shortCode = nanoid(6);
        const newUrl = new Url({
            originalUrl: longUrl,
            shortCode: shortCode,
            user: req.userId // Associate the link with the logged-in user
        });

        await newUrl.save();

        res.json({
            message: 'Success! Saved to Database.',
            shortCode: shortCode,
            shortUrl: `http://localhost:5000/${shortCode}`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error while generating short link' });
    }
});

// 2. DASHBOARD ROUTE: Must be ABOVE the generic /:shortCode route!
app.get('/api/dashboard', authMiddleware, async (req, res) => {
    try {
        const allUrls = await Url.find({ user: req.userId });
        res.json({
            count: allUrls.length,
            urls: allUrls
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error while fetching dashboard data' });
    }
});

// 3. REDIRECT ROUTE: Kept at the bottom so it doesn't intercept the dashboard route
app.get('/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;

        // Find the record
        const urlRecord = await Url.findOne({ shortCode });

        if (!urlRecord) {
            return res.status(404).send('<h1>Link not found</h1>');
        }

        // Increment and save cleanly
        urlRecord.clicks += 1;
        await urlRecord.save();

        // Perform redirection
        return res.redirect(urlRecord.originalUrl);

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error during redirection');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});