// server/routes/sessionRoutes.js 
const express = require('express');
const router = express.Router();
const sessionControllers = require('../controllers/sessionControllers');


// POST /api/sessions

// const { createSession, closeCurrentSession } = require('../controllers/sessionControllers');
// router.post('/', createSession);
// afficher le tableau avec tous les statuts, durées, etc.
router.get('/', sessionControllers.getSessions);
router.post('/start', sessionControllers.createSession);
router.post('/close', sessionControllers.closeCurrentSession);
// Presence Total
router.get('/user/:id/status-today', sessionControllers.getUserStatusToday);

// 
router.get("/user/:id/today-aggregates", sessionControllers.getUserTodayAggregates);
// 
router.get('/user/:id/day-total', sessionControllers.getUserDayTotal)
// la session active (statut actuel)
router.get('/user/:id/active', sessionControllers.getActiveSession);
// GET /api/sessions/history/:user_id
router.get('/history/:id', sessionControllers.getUserHistory);
// POST /api/sessions/change
router.post('/change', sessionControllers.changeStatus);

module.exports = router;
