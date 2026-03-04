require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const apiRoutes = require('./routes/api');

const app = express();

app.use(express.json());

app.use('/api/v1', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    });
}

module.exports = app;
