// server/routes/sessionRoutes.js
const express = require('express');
const router = express.Router();

const sessionControllers = require('../controllers/sessionControllers');

// 📌 Récupérer toutes les sessions avec leurs statuts/durées
router.get('/', sessionControllers.getSessions);

// 📌 Démarrer une session
router.post('/start', sessionControllers.createSession);

// 📌 Fermer la session en cours
router.post('/close', sessionControllers.closeCurrentSession);

// 📌 Forcer la fermeture d’une session
router.post('/close-force', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "❌ userId requis" });
    }

    const session = await sessionControllers.closeSessionForce(userId);

    if (!session) {
      return res.status(404).json({ message: "⚠️ Aucune session active trouvée pour cet utilisateur" });
    }

    res.json({ message: "✅ Session fermée avec succès", session });
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

router.get('/user/agent_connection_details', sessionControllers.getDailyConnectionTimes);

router.post('/export-sessions', sessionControllers.exportSessions);

// 📌 Statut & présence totale d’un utilisateur aujourd’hui
router.get('/user/:id/status-today', sessionControllers.getUserStatusToday);

module.exports = router;
