// server/routes/sessionRoutes.js 
const express = require('express');
const router = express.Router();
const sessionControllers = require('../controllers/sessionControllers');


// POST /api/sessions

// const { createSession, closeCurrentSession } = require('../controllers/sessionControllers');
// router.post('/', createSession);
router.post('/start', sessionControllers.createSession);
router.post('/close', sessionControllers.closeCurrentSession);

module.exports = router;
