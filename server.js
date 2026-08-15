const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); // Forces Node.js to use Google and Cloudflare DNS directly
require('dotenv').config(); // Load our secret keys from the .env file
const express = require('express');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const Url = require('./models/url'); // Import our database blueprint
const User = require('./models/user'); // Import our User database blueprint


const app = express();

//Middleware
app.use(express.json());
app.use(cookieParser());

//Enable CORE for live Server with credentials
app.use(cors({
    origin:'http://localhost:5500',    
    credentials: true
}));


// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Database connected successfully to MongoDB Atlas!'))
    .catch(err => console.error('Database connection error:', err));






app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Please enter all fields' });
    }

    try {
        
        let userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: 'A user with this email already exists' });
        }

        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        
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


app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide email and password' });
    }

    try {
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } 
        );

        
        res.cookie('token', token, {
            httpOnly: true, 
            secure: false, 
            sameSite: 'lax', 
            path: '/', 
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });

        res.json({
            message: 'Login successful!',
            user: { id: user._id, name: user.name, email: user.email }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during login' });
    }
});


app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token', {path:'/'}); 
    res.json({ message: 'Logged out Successfully' });
});




const authMiddleware = (req, res, next) => {
    
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'No token provided, authorization denied' });
    }

    try {
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        
        req.userId = decoded.userId;

        next(); 
    } catch (error) {
        res.status(401).json({ error: 'Token is invalid or expired' });
    }
};


app.post('/api/shorten', authMiddleware, async (req, res) => {
    const { longUrl } = req.body;

    if (!longUrl) {
        return res.status(400).json({ error: 'Please provide a longUrl' });
    }

    try {
        const shortCode = nanoid(6);
        const newUrl = new Url({
            originalUrl: longUrl,
            shortCode: shortCode,
            user: req.userId 
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


app.get('/api/dashboard', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const allUrls = await Url.find({ user: req.userId });
        res.json({
            user: {
                username: user.name,
                email: user.email
            },
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