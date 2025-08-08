const express = require('express');
const router = express.Router();
const { getTodaySummary, getWeeklySales, getSales } = require('../controllers/salesControllers');
const auth = require('../middlewares/authMiddleware');

// Routes pour les ventes
router.get('/', auth, getSales);

// Résumé des ventes du jour (protégé)
router.get('/today-summary', auth, getTodaySummary);

// Ventes hebdomadaires (protégé)
router.get('/weekly', auth, getWeeklySales);

module.exports = router;
