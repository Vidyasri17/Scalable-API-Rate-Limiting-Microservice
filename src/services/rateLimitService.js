const redis = require('../config/redis');
const Client = require('../models/Client');

const getClientConfig = async (clientId) => {
    return await Client.findOne({ clientId });
};

const checkRateLimit = async (clientId, path) => {
    const client = await getClientConfig(clientId);
    if (!client) {
        throw new Error('Client not found');
    }

    const capacity = client.maxRequests;
    const windowSeconds = client.windowSeconds;
    const refillRate = capacity / windowSeconds; // tokens per second

    const key = `ratelimit:${clientId}:${path}`;
    const now = Date.now();

    // Lua script to atomically update the Token Bucket state
    const luaScript = `
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refillRate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        local windowSeconds = tonumber(ARGV[4])
        
        local state = redis.call('HMGET', key, 'tokens', 'last_refill')
        local tokens = tonumber(state[1])
        local last_refill = tonumber(state[2])
        
        if not tokens then
            tokens = capacity
            last_refill = now
        end
        
        local elapsedTime = math.max(0, (now - last_refill) / 1000)
        local tokensToAdd = elapsedTime * refillRate
        
        tokens = math.min(capacity, tokens + tokensToAdd)
        
        local allowed = false
        if tokens >= 1 then
            tokens = tokens - 1
            allowed = true
        end
        
        redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
        redis.call('EXPIRE', key, windowSeconds * 2)
        
        return { allowed and 1 or 0, math.floor(tokens), now }
    `;

    const result = await redis.eval(
        luaScript,
        1,
        key,
        capacity,
        refillRate,
        now,
        windowSeconds
    );

    const allowed = result[0] === 1;
    const remainingRequests = result[1];

    let resetTime;
    let retryAfter = 0;
    if (!allowed) {
        const msPerToken = (1 / refillRate) * 1000;
        const msToNextToken = msPerToken - (now % msPerToken);
        resetTime = new Date(now + msToNextToken).toISOString();
        retryAfter = Math.ceil(msToNextToken / 1000);
    } else {
        resetTime = new Date(now + (windowSeconds * 1000)).toISOString();
    }

    return {
        allowed,
        remainingRequests: allowed ? remainingRequests : 0,
        retryAfter: allowed ? undefined : retryAfter,
        resetTime
    };
};

module.exports = {
    checkRateLimit
};
