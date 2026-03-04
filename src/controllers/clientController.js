const clientService = require('../services/clientService');
const Joi = require('joi');

const registerSchema = Joi.object({
    clientId: Joi.string().required(),
    apiKey: Joi.string().required(),
    maxRequests: Joi.number().integer().min(1).optional(),
    windowSeconds: Joi.number().integer().min(1).optional()
});

const registerClient = async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const client = await clientService.registerClient(value);
        res.status(201).json(client);
    } catch (err) {
        if (err.status === 409) {
            return res.status(409).json({ error: err.message });
        }
        console.error('Registration Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    registerClient
};
