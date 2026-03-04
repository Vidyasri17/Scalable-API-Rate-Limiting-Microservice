const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const Client = require('../../src/models/Client');
const redis = require('../../src/config/redis');

beforeAll(async () => {
    const url = process.env.DATABASE_URL || 'mongodb://localhost:27017/ratelimitdb';
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(url);
    }
    await Client.deleteMany({});
});

afterAll(async () => {
    await mongoose.connection.close();
    await redis.quit();
});

describe('Integration Tests', () => {
    it('should register a new client', async () => {
        const res = await request(app)
            .post('/api/v1/clients')
            .send({
                clientId: 'int-client-1',
                apiKey: 'secret',
                maxRequests: 5,
                windowSeconds: 2
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body.clientId).toEqual('int-client-1');
    });

    it('should check rate limit for existing client', async () => {
        const res = await request(app)
            .post('/api/v1/ratelimit/check')
            .send({
                clientId: 'int-client-1',
                path: '/test'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body.allowed).toEqual(true);
    });

    it('should block after exceeding limits', async () => {
        // We already used 1 request. We have 4 left out of 5.
        for (let i = 0; i < 4; i++) {
            await request(app).post('/api/v1/ratelimit/check').send({
                clientId: 'int-client-1',
                path: '/test'
            });
        }

        // 6th request should fail
        const res = await request(app)
            .post('/api/v1/ratelimit/check')
            .send({
                clientId: 'int-client-1',
                path: '/test'
            });

        expect(res.statusCode).toEqual(429);
        expect(res.body.allowed).toEqual(false);
        expect(res.body.retryAfter).toBeDefined();
    });
});
