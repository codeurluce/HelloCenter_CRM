// server/routes/sessionRoutes.js
const express = require('express');
const router = express.Router();

const sessionControllers = require('../controllers/sessionControllers');
const auth = require('../middlewares/authMiddleware');
const siteScope = require('../middlewares/siteScope');


/**
 * =====================
 * ROUTES PUBLIQUES
 * =====================
 */

// Routes GET : récupération des données

router.get('/', sessionControllers.getSessions); // 📌 Récupère toutes les sessions avec leurs statuts et durées  // Méthode : GET /api/sessions
router.get('/check', sessionControllers.checkSessionActive);  // 📌 Vérifie si une session est active // Méthode : GET /api/sessions/check
router.get('/last-status/:userId', sessionControllers.getLastAgentStatus); // 📌 Récupère le dernier statut d’un agent par son userId (utile pour restauration après reconnexion) // Méthode : GET /api/sessions/last-status/:userId
router.get('/user/live', sessionControllers.getLiveSessionAgents); // 📌 Récupère toutes les sessions en ligne des agents actifs // Méthode : GET /api/sessions/user/live
router.get('/user/live/:userId', sessionControllers.getSessionAgent); // 📌 Récupère la session active d’un agent spécifique par userId // Méthode : GET /api/sessions/user/live/:userId
router.get('/user/agent-connection-details', sessionControllers.getDailyConnectionTimes); // 📌 Récupère le détail des connexions journalières des agents // Méthode : GET /api/sessions/user/agent_connection_details
router.get('/user/:id/status-today', sessionControllers.getUserStatusToday); // 📌 Récupère le statut et présence totale d’un utilisateur pour la journée en cours // Méthode : GET /api/sessions/user/:id/status-today
router.get('/user/:id/all-history', sessionControllers.getAllHistorySessions) // 📌 Récupère tout l’historique des sessions d’un utilisateur donné // Méthode : GET /api/sessions/user/:id/all-history
router.get("/agent-session-details/:userId/:date", sessionControllers.getSessionDetailsOptimized); // 📌 Récupère les détails d’une session agent pour correction par l’admin (statuts et durées en secondes) // Méthode : GET /api/sessions/agent-session-details/:userId/:date

// Route POST : création de données
router.post('/start', sessionControllers.startSession); // 📌 Démarre une nouvelle session // Méthode : POST /api/sessions/start
router.post('/stop', sessionControllers.stopSession); // 📌 Ferme la session en cours // Méthode : POST /api/sessions/stop
router.post('/ping', sessionControllers.pingSession); // 📌 Ping une session pour vérifier sa disponibilité // Méthode : POST /api/sessions/ping


/**
 * =====================
 * ROUTES PRIVÉES (auth + siteScope)
 * =====================
 */
router.use(auth);
router.use(siteScope);

// Routes GET : récupération des données
router.get('/agents-session-rh', sessionControllers.getSessionAgentsForRH); // 📌 Récupère les sessions des agents pour le RH // Méthode : GET /api/sessions/agents-session-rh
router.get('/export-session-rh', sessionControllers.exportSessionAgentsForRH); // 📌 Exporte les sessions des agents pour le RH // Méthode : GET /api/sessions/export-session-rh
router.get('/monthly',  sessionControllers.getMonthlySessions); // 📌 Récupère les sessions du mois en cours pour tous les agents (filtrage et pagination possibles) // Méthode : GET /api/sessions/monthly
router.get('/monthly-filtre',  sessionControllers.getMonthlySessionsFiltre); // 📌 Récupère les sessions du mois en cours pour tous les agents avec filtres avancés // Méthode : GET /api/sessions/monthly-filtre

// Route POST : modification de données
router.post('/:id/forcePause', sessionControllers.forcePauseByAdmin); // 📌 Change le statut d’une session en cours par l'admin (ex: Disponible → Pause) // Méthode : POST /api/sessions/change-status
router.post('/heartbeat',  sessionControllers.heartbeat); // 📌 Heartbeat : maintient la session active, vérification token nécessaire // Méthode : POST /api/sessions/heartbeat
router.post('/close-force', sessionControllers.closeForceSession);// 📌 Force la fermeture d’une session pour un utilisateur donné (via user_id dans le body) // Méthode : POST /api/sessions/close-force
router.post('/export-sessions', sessionControllers.exportSessions); // 📌 Exporte les sessions par l'admin (format ou destination selon implémentation) // Méthode : POST /api/sessions/export-sessions
router.patch('/correct-cumul/:id', sessionControllers.correctCumul);
router.post('/clean-shift', sessionControllers.cleanShift);  // 📌 Nettoie les sessions après la fin de shift (manuellement via API) // Méthode : POST /api/sessions/clean-shift

module.exports = router;