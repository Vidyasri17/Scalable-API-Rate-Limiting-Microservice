const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (process.env.NODE_ENV === 'test') { return; }
        const url = process.env.DATABASE_URL || 'mongodb://localhost:27017/ratelimitdb';
        const conn = await mongoose.connect(url);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
