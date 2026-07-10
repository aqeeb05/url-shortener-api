const mongoose = require('mongoose');

const UrlSchema = new mongoose.Schema({
    originalUrl: {
        type: String,
        required: true
    },
    shortCode: {
        type: String,
        required: true,
        unique: true
    },
    clicks: {
        type: Number,
        default: 0
    },
    // LINK TO USER: Points directly to a unique user document ID
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // Forces every link to have an owner
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Url', UrlSchema);