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
const authorizeRole = require('../middlewares/authorizeRole'); 
const siteScope = require('../middlewares/siteScope');


// =====================
// ROUTES Privées 
// =====================
router.use(auth);
router.use(siteScope);

// Routes GET : récupération des données
router.get('/today-summary',   getTodaySummary); // Récupère le résumé des ventes du jour pour l'agent connecté (authentification requise) // Méthode : GET /api/sales/today-sum
router.get('/admin-summary',   getAdminSalesSummary); // Récupère le résumé global des ventes du jour pour l'administration (authentification requise) // Méthode : GET /api/sales/admin-summary
router.get('/admin-monthly',   getAdminSalesMonthly)   // Récupère le résumé global des ventes du mois pour l'administration
router.get('/weekly',   getWeeklySales); // Récupère les ventes hebdomadaires de l'agent connecté (authentification requise) // Méthode : GET /api/sales/weekly
router.get('/weekly-agents',   getWeeklySalesAllAgents); // Récupère les ventes hebdomadaires de tous les agents pour l'administration (authentification requise) // Méthode : GET /api/sales/weekly-agents
router.get('/weekly-agents-charthorizontal',   getAgentsWeeklySales);// Récupère les ventes hebdomadaires détaillées par agent sous forme de diagramme horizontal (authentification requise) // Méthode : GET /api/sales/weekly-agents-charthorizontal
router.get('/monthly-agents',   getMonthlySalesAllAgents); // Récupère le résumé mensuel des ventes de tous les agents, regroupé par semaine // Méthode : GET /api/sales/monthly-agents
router.get('/monthly-agents-charthorizontal', getAgentsMonthlySales); // Récupère le résumé mensuel détaillé par agent sous forme de diagramme horizontal // Méthode : GET /api/sales/monthly-agents-charthorizontal
router.get('/admin',   getAllSales); // Récupère toutes les ventes pour l'administration (authentification requise) // Méthode : GET /api/sales/admin
router.get('/',   getSales); // Récupère toutes les ventes de l'agent connecté (authentification requise) // Méthode : GET /api/sales
router.get('/:id',   getSaleById); // Récupère une vente spécifique par son ID pour l'agent connecté (authentification requise) // Méthode : GET /api/sales/:id

// Route POST : création de données
router.post('/',   createSale); // Crée/enregistre une nouvelle vente (authentification requise) // Méthode : POST /api/sales

// Routes PUT : modification de données
router.put('/:id/change-status',   updateSaleStatus); // Met à jour le statut d'une vente spécifique par son ID (authentification requise) // Méthode : PUT /api/sales/:id/change-status
router.put('/energie/:id',   updateSale); // Modifie une vente énergie par son ID (authentification requise) // Méthode : PUT /api/sales/energie/:id
router.put('/offre-mobile/:id',   updateSaleMobile); // Modifie une vente offre mobile par son ID (authentification requise) // Méthode : PUT /api/sales/offre-mobile/:id
router.put('/:id/audit',   auditeSale); // Audite une vente spécifique par ID (authentification requise) // Méthode : PUT /api/sales/:id/audit

// Route DELETE : suppression de données dans le fichier SalesActions (frontend)
router.delete('/:id/delete',   deleteSale); // Supprime une vente spécifique par son ID (authentification requise) // Méthode : DELETE /api/sales/:id
router.delete('/delete-multiple',   deleteMultipleSales); // supprimer plusieurs ventes à la fois

module.exports = router;


// a l'avenir pour plus de securité rajouter 
// Donc faudra verifier les roles admin ou manager pour certaines routes sensibles
// router.get('/admin-monthly', authorizeRole('admin', 'manager'), getAdminSalesMonthly);pour les deux roles admin et manager  
// router.get('/admin-monthly', authorizeRole('admin'), getAdminSalesMonthly); juste pour admin