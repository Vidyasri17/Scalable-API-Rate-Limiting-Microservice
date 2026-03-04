const bcrypt = require('bcryptjs');
const Client = require('../models/Client');

const registerClient = async (data) => {
    const { clientId, apiKey, maxRequests, windowSeconds } = data;

    const existing = await Client.findOne({ clientId });
    if (existing) {
        const err = new Error('Client ID already exists');
        err.status = 409;
        throw err;
    }

    const hashedApiKey = await bcrypt.hash(apiKey, 10);

    const client = new Client({
        clientId,
        hashedApiKey,
        maxRequests,
        windowSeconds
    });

    await client.save();

    return {
        clientId: client.clientId,
        maxRequests: client.maxRequests,
        windowSeconds: client.windowSeconds
    };
};

module.exports = {
    registerClient
};
