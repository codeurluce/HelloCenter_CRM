const express = require('express');
const router = express.Router();
const { createSession } = require('../controllers/sessionControllers');

// POST /api/sessions
router.post('/sessions', createSession);

module.exports = router;