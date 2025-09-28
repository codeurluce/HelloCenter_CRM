// server/routes/sessionRoutes.js
const express = require('express');
const router = express.Router();

const sessionControllers = require('../controllers/sessionControllers');

// 📌 Récupérer toutes les sessions avec leurs statuts/durées
router.get('/', sessionControllers.getSessions);

// 📌 Démarrer une session
// router.post('/start', sessionControllers.createSession);
router.post('/start', sessionControllers.startSession);

// 📌 Fermer la session en cours
// router.post('/close', sessionControllers.closeCurrentSession);
router.post('/stop', sessionControllers.stopSession);

// 📌 ping une session
router.post('/ping', sessionControllers.pingSession)

// 📌 Forcer la fermeture d’une session
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
});

// 📌 Récupérer le dernier statut d’un agent (pour restauration après reconnexion)
router.get("/last-status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const status = await getLastAgentStatus(userId);
    res.json({ status });
  } catch (err) {
    console.error("Erreur route /last-status:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 📌 Sessions en ligne (agents actifs)
router.get('/user/live', sessionControllers.getLiveSessionAgents);
router.get('/user/live/:userId', sessionControllers.getSessionAgent);

router.get('/user/agent_connection_details', sessionControllers.getDailyConnectionTimes);

router.post('/export-sessions', sessionControllers.exportSessions);

// 📌 Statut & présence totale d’un utilisateur aujourd’hui
router.get('/user/:id/status-today', sessionControllers.getUserStatusToday);

module.exports = router;
