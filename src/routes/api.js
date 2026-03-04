const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const rateLimitController = require('../controllers/rateLimitController');

router.post('/clients', clientController.registerClient);
router.post('/ratelimit/check', rateLimitController.checkRateLimit);

module.exports = router;
