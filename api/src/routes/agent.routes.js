const express = require('express');
const router = express.Router();
const { validateAgentRequest } = require('../middleware/agent.middleware');

// Agent health check
router.get('/health', validateAgentRequest, (req, res) => {
    res.json({ status: 'ok' });
});

module.exports = router;
