const express = require('express');
const router = express.Router();
const { 
    getTodaySummary, 
    getWeeklySales, 
    getSales, 
    createSale,
    getSaleById,
    updateSale,
    deleteSale  
    } = require('../controllers/salesControllers');
const auth = require('../middlewares/authMiddleware');


router.get('/today-summary', auth, getTodaySummary); // Résumé des ventes du jour (protégé)
router.get('/weekly', auth, getWeeklySales); // Ventes hebdomadaires (protégé)


router.get('/', auth, getSales); // Récupérer tous les ventes de l'agent


router.get('/:id', auth, getSaleById); // Recuperer une vente par son ID (protégé)
router.put('/:id', auth, updateSale); // Modifier une vente (protégé)
router.delete('/:id', auth, deleteSale); // Supprimer une vente (protégé)


router.post('/', auth, createSale); // Enregistrer une vente (protégé)

module.exports = router;
