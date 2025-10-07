// server/routes/sessionRoutes.js
const express = require('express');
const router = express.Router();

const sessionControllers = require('../controllers/sessionControllers');
const { verifyToken } = require ('../controllers/userControllers');


// Routes GET : récupération des données

// 📌 Récupère toutes les sessions avec leurs statuts et durées
router.get('/', sessionControllers.getSessions); // Méthode : GET /api/sessions

// 📌 Vérifie si une session est active
router.get('/check', sessionControllers.checkSessionActive); // Méthode : GET /api/sessions/check

// 📌 Récupère le dernier statut d’un agent par son userId (utile pour restauration après reconnexion)
router.get("/last-status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const status = await getLastAgentStatus(userId);
    res.json({ status });
  } catch (err) {
    console.error("Erreur route /last-status:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}); // Méthode : GET /api/sessions/last-status/:userId

// 📌 Récupère toutes les sessions en ligne des agents actifs
router.get('/user/live', sessionControllers.getLiveSessionAgents); // Méthode : GET /api/sessions/user/live

// 📌 Récupère la session active d’un agent spécifique par userId
router.get('/user/live/:userId', sessionControllers.getSessionAgent); // Méthode : GET /api/sessions/user/live/:userId

// 📌 Récupère le détail des connexions journalières des agents
router.get('/user/agent_connection_details', sessionControllers.getDailyConnectionTimes); // Méthode : GET /api/sessions/user/agent_connection_details

// 📌 Récupère le statut et présence totale d’un utilisateur pour la journée en cours
router.get('/user/:id/status-today', sessionControllers.getUserStatusToday); // Méthode : GET /api/sessions/user/:id/status-today


// Route POST : création de données

// 📌 Démarre une nouvelle session
router.post('/start', sessionControllers.startSession); // Méthode : POST /api/sessions/start

// 📌 Ferme la session en cours
router.post('/stop', sessionControllers.stopSession); // Méthode : POST /api/sessions/stop

// 📌 Heartbeat : maintient la session active, vérification token nécessaire
router.post('/heartbeat', verifyToken, sessionControllers.heartbeat); // Méthode : POST /api/sessions/heartbeat
 
// 📌 Ping une session pour vérifier sa disponibilité
router.post('/ping', sessionControllers.pingSession); // Méthode : POST /api/sessions/ping

// 📌 Force la fermeture d’une session pour un utilisateur donné (via user_id dans le body)
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
}); // Méthode : POST /api/sessions/close-force

// 📌 Exporte les sessions (format ou destination selon implémentation)
router.post('/export-sessions', sessionControllers.exportSessions); // Méthode : POST /api/sessions/export-sessions


module.exports = router;
