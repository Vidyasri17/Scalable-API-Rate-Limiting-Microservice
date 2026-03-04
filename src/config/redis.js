const Redis = require('ioredis');

// Ensure we don't try to connect to localhost:6379 during CI unit tests if Redis is mocked.
// The tests will mock this module or the ioredis constructor completely.
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    lazyConnect: process.env.NODE_ENV === 'test' // prevents auto connect in test if not mocked
});

redisClient.on('error', (err) => {
    if (process.env.NODE_ENV !== 'test') {
        console.error('Redis Client Error', err);
    }
});

module.exports = redisClient;
