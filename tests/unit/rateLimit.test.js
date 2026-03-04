const rateLimitService = require('../../src/services/rateLimitService');
const redis = require('../../src/config/redis');
const Client = require('../../src/models/Client');

jest.mock('../../src/models/Client');
jest.mock('../../src/config/redis', () => ({
    eval: jest.fn(),
    on: jest.fn(),
    quit: jest.fn()
}));

describe('Rate Limit Service - Token Bucket', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should throw an error if client is not found', async () => {
        Client.findOne.mockResolvedValue(null);
        await expect(rateLimitService.checkRateLimit('unknown', '/api/test')).rejects.toThrow('Client not found');
    });

    it('should allow request if tokens are available', async () => {
        Client.findOne.mockResolvedValue({
            clientId: 'client1',
            maxRequests: 10,
            windowSeconds: 60
        });

        redis.eval.mockResolvedValue([1, 9, Date.now()]);

        const result = await rateLimitService.checkRateLimit('client1', '/api/test');
        expect(result.allowed).toBe(true);
        expect(result.remainingRequests).toBe(9);
        expect(result.retryAfter).toBeUndefined();
    });

    it('should deny request if no tokens are available', async () => {
        Client.findOne.mockResolvedValue({
            clientId: 'client1',
            maxRequests: 10,
            windowSeconds: 60
        });

        const now = Date.now();
        redis.eval.mockResolvedValue([0, 0, now]);

        const result = await rateLimitService.checkRateLimit('client1', '/api/test');
        expect(result.allowed).toBe(false);
        expect(result.remainingRequests).toBe(0);
        expect(result.retryAfter).toBeGreaterThan(0);
    });
});
