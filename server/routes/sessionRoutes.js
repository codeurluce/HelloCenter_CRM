// server/routes/sessionRoutes.js
const express = require('express');
const router = express.Router();

const sessionControllers = require('../controllers/sessionControllers');
const { verifyToken } = require('../controllers/userControllers');


// Routes GET : récupération des données

router.get('/', sessionControllers.getSessions); // 📌 Récupère toutes les sessions avec leurs statuts et durées  // Méthode : GET /api/sessions
router.get('/check', sessionControllers.checkSessionActive);  // 📌 Vérifie si une session est active // Méthode : GET /api/sessions/check
router.get('/last-status/:userId', sessionControllers.getLastAgentStatus); // 📌 Récupère le dernier statut d’un agent par son userId (utile pour restauration après reconnexion) // Méthode : GET /api/sessions/last-status/:userId
router.get('/user/live', sessionControllers.getLiveSessionAgents); // 📌 Récupère toutes les sessions en ligne des agents actifs // Méthode : GET /api/sessions/user/live
router.get('/agents-session-rh', sessionControllers.getSessionAgentsForRH); // 📌 Récupère les sessions des agents pour le RH // Méthode : GET /api/sessions/agents-session-rh
router.get('/export-session-rh', sessionControllers.exportSessionAgentsForRH); // 📌 Exporte les sessions des agents pour le RH // Méthode : GET /api/sessions/export-session-rh
router.get('/user/live/:userId', sessionControllers.getSessionAgent); // 📌 Récupère la session active d’un agent spécifique par userId // Méthode : GET /api/sessions/user/live/:userId
router.get('/user/agent-connection-details', sessionControllers.getDailyConnectionTimes); // 📌 Récupère le détail des connexions journalières des agents // Méthode : GET /api/sessions/user/agent_connection_details
router.get('/user/:id/status-today', sessionControllers.getUserStatusToday); // 📌 Récupère le statut et présence totale d’un utilisateur pour la journée en cours // Méthode : GET /api/sessions/user/:id/status-today
router.get('/user/:id/all-history', sessionControllers.getAllHistorySessions) // 📌 Récupère tout l’historique des sessions d’un utilisateur donné // Méthode : GET /api/sessions/user/:id/all-history
router.get('/monthly', verifyToken, sessionControllers.getMonthlySessions); // 📌 Récupère les sessions du mois en cours pour tous les agents (filtrage et pagination possibles) // Méthode : GET /api/sessions/monthly
router.get('/monthly-filtre', verifyToken, sessionControllers.getMonthlySessionsFiltre); // 📌 Récupère les sessions du mois en cours pour tous les agents avec filtres avancés // Méthode : GET /api/sessions/monthly-filtre
router.patch('/correct-session', sessionControllers.correctSession); // 📌 Corrige une session existante avec de nouvelles durées pour chaque statut // Méthode : PATCH /api/sessions/correct-session
router.get('/for-correct', sessionControllers.getSessionforCorrect);  // 📌 Récupère les sessions pouvant être corrigées par l’admin (avec info si déjà corrigée) // Méthode : GET /api/sessions/for-correct
router.get("/agent-session-details/:userId/:date", sessionControllers.getSessionDetailsForCorrection); // 📌 Récupère les détails d’une session agent pour correction par l’admin (statuts et durées en secondes) // Méthode : GET /api/sessions/agent-session-details/:userId/:date

// Route POST : création de données

router.post('/start', sessionControllers.startSession); // 📌 Démarre une nouvelle session // Méthode : POST /api/sessions/start
router.post('/stop', sessionControllers.stopSession); // 📌 Ferme la session en cours // Méthode : POST /api/sessions/stop
router.post('/:id/forcePause', verifyToken, sessionControllers.forcePauseByAdmin); // 📌 Change le statut d’une session en cours par l'admin (ex: Disponible → Pause) // Méthode : POST /api/sessions/change-status
router.post('/heartbeat', verifyToken, sessionControllers.heartbeat); // 📌 Heartbeat : maintient la session active, vérification token nécessaire // Méthode : POST /api/sessions/heartbeat
router.post('/ping', sessionControllers.pingSession); // 📌 Ping une session pour vérifier sa disponibilité // Méthode : POST /api/sessions/ping
router.post('/close-force', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ message: "❌ user_id est requis" });
    }

    const sessionResult = await db.query(
      `UPDATE session_agents
       SET end_time = NOW(),
           duration = EXTRACT(EPOCH FROM (NOW() - start_time))
       WHERE user_id = $1 AND end_time IS NULL
       RETURNING *`,
      [user_id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(200).json({ message: "ℹ️ Aucune session active à fermer" });
    }

    await db.query("UPDATE users SET is_connected = FALSE WHERE id = $1", [user_id]);
    await db.query(
      "INSERT INTO agent_connections_history (user_id, event_type) VALUES ($1, 'disconnect_force')",
      [user_id]
    );
    res.json({
      message: "✅ Session fermée avec succès",
      session: sessionResult.rows[0]
    });

  } catch (err) {
    console.error("❌ Erreur dans /close-force:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}); // 📌 Force la fermeture d’une session pour un utilisateur donné (via user_id dans le body) // Méthode : POST /api/sessions/close-force
router.post('/export-sessions', sessionControllers.exportSessions); // 📌 Exporte les sessions par l'admin (format ou destination selon implémentation) // Méthode : POST /api/sessions/export-sessions
// router.post('/export-sessions-agent', sessionControllers.exportSessionsAgent); // 📌 Exporte session par l'agent (l'agent exporte juste sa propre session) // Méthode : POST /api/sessions/export-sessions

module.exports = router;
