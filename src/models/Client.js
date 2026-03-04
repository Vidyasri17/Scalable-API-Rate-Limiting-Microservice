const mongoose = require('mongoose');

const clientSchema = mongoose.Schema({
    clientId: {
        type: String,
        required: true,
        unique: true
    },
    hashedApiKey: {
        type: String,
        required: true
    },
    maxRequests: {
        type: Number,
        required: true,
        default: function () {
            return parseInt(process.env.DEFAULT_RATE_LIMIT_MAX_REQUESTS) || 100;
        }
    },
    windowSeconds: {
        type: Number,
        required: true,
        default: function () {
            return parseInt(process.env.DEFAULT_RATE_LIMIT_WINDOW_SECONDS) || 60;
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Client', clientSchema);
