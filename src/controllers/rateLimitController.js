const rateLimitService = require('../services/rateLimitService');
const Joi = require('joi');

const checkSchema = Joi.object({
    clientId: Joi.string().required(),
    path: Joi.string().required()
});

const checkRateLimit = async (req, res) => {
    try {
        const { error, value } = checkSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const result = await rateLimitService.checkRateLimit(value.clientId, value.path);

        if (!result.allowed) {
            res.set('Retry-After', result.retryAfter);
            return res.status(429).json({
                allowed: false,
                retryAfter: result.retryAfter,
                resetTime: result.resetTime
            });
        }

        res.status(200).json({
            allowed: true,
            remainingRequests: result.remainingRequests,
            resetTime: result.resetTime
        });

    } catch (err) {
        if (err.message === 'Client not found') {
            return res.status(400).json({ error: 'Client not found' });
        }
        console.error('Rate Limit Check Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    checkRateLimit
};
