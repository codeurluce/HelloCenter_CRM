const express = require('express');
const router = express.Router();
const { 
    getTodaySummary, 
    getWeeklySales, 
    getSales, 
    createSale,
    getSaleById,
    updateSale,
    deleteSale,  
    getAllSales,
    updateSaleStatus,
    updateSaleMobile,
    auditeSale,
    getAdminSalesSummary
    } = require('../controllers/salesControllers');
const auth = require('../middlewares/authMiddleware');


router.get('/today-summary', auth, getTodaySummary); // Résumé des ventes du jour (protégé)
router.get('/admin-summary', auth, getAdminSalesSummary); // Résumé de toutes les ventes pour l'admin (protégé)

router.get('/weekly', auth, getWeeklySales); // Ventes hebdomadaires (protégé)

router.get('/admin', auth, getAllSales)
router.get('/', auth, getSales); // Récupérer tous les ventes de l'agent

router.put('/:id/change-status', auth, updateSaleStatus);
router.get('/:id', auth, getSaleById); // Recuperer une vente par son ID (protégé)
router.put('/energie/:id', auth, updateSale); // Modifier une vente Energie (protégé)
router.put('/offre-mobile/:id', auth, updateSaleMobile); // Modifier une vente OffreMobile (protégé)
router.delete('/:id', auth, deleteSale); // Supprimer une vente (protégé)
router.put('/:id/audit', auth, auditeSale)  // Auditer une vente


router.post('/', auth, createSale); // Enregistrer une vente (protégé)

module.exports = router;
