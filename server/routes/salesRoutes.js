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
    getAdminSalesSummary,
    getWeeklySalesAllAgents,
    getAgentsWeeklySales, // diagramme horizontal
    getMonthlySalesAllAgents,
    getAgentsMonthlySales,
    getAdminSalesMonthly,
    deleteMultipleSales,
    } = require('../controllers/salesControllers');
const auth = require('../middlewares/authMiddleware');

// Routes GET : récupération des données

router.get('/today-summary', auth, getTodaySummary); // Récupère le résumé des ventes du jour pour l'agent connecté (authentification requise) // Méthode : GET /api/sales/today-sum
router.get('/admin-summary', auth, getAdminSalesSummary); // Récupère le résumé global des ventes du jour pour l'administration (authentification requise) // Méthode : GET /api/sales/admin-summary
router.get('/admin-monthly', auth, getAdminSalesMonthly)   // Récupère le résumé global des ventes du mois pour l'administration
router.get('/weekly', auth, getWeeklySales); // Récupère les ventes hebdomadaires de l'agent connecté (authentification requise) // Méthode : GET /api/sales/weekly
router.get('/weekly-agents', auth, getWeeklySalesAllAgents); // Récupère les ventes hebdomadaires de tous les agents pour l'administration (authentification requise) // Méthode : GET /api/sales/weekly-agents
router.get('/weekly-agents-charthorizontal', auth, getAgentsWeeklySales);// Récupère les ventes hebdomadaires détaillées par agent sous forme de diagramme horizontal (authentification requise) // Méthode : GET /api/sales/weekly-agents-charthorizontal
router.get('/monthly-agents', getMonthlySalesAllAgents); // Récupère le résumé mensuel des ventes de tous les agents, regroupé par semaine // Méthode : GET /api/sales/monthly-agents
router.get('/monthly-agents-charthorizontal', getAgentsMonthlySales); // Récupère le résumé mensuel détaillé par agent sous forme de diagramme horizontal // Méthode : GET /api/sales/monthly-agents-charthorizontal
router.get('/admin', auth, getAllSales); // Récupère toutes les ventes pour l'administration (authentification requise) // Méthode : GET /api/sales/admin
router.get('/', auth, getSales); // Récupère toutes les ventes de l'agent connecté (authentification requise) // Méthode : GET /api/sales
router.get('/:id', auth, getSaleById); // Récupère une vente spécifique par son ID pour l'agent connecté (authentification requise) // Méthode : GET /api/sales/:id

// Route POST : création de données
router.post('/', auth, createSale); // Crée/enregistre une nouvelle vente (authentification requise) // Méthode : POST /api/sales

// Routes PUT : modification de données
router.put('/:id/change-status', auth, updateSaleStatus); // Met à jour le statut d'une vente spécifique par son ID (authentification requise) // Méthode : PUT /api/sales/:id/change-status
router.put('/energie/:id', auth, updateSale); // Modifie une vente énergie par son ID (authentification requise) // Méthode : PUT /api/sales/energie/:id
router.put('/offre-mobile/:id', auth, updateSaleMobile); // Modifie une vente offre mobile par son ID (authentification requise) // Méthode : PUT /api/sales/offre-mobile/:id
router.put('/:id/audit', auth, auditeSale); // Audite une vente spécifique par ID (authentification requise) // Méthode : PUT /api/sales/:id/audit

// Route DELETE : suppression de données dans le fichier SalesActions (frontend)
router.delete('/:id/delete', auth, deleteSale); // Supprime une vente spécifique par son ID (authentification requise) // Méthode : DELETE /api/sales/:id
router.delete('/delete-multiple', auth, deleteMultipleSales); // supprimer plusieurs ventes à la fois
module.exports = router;
