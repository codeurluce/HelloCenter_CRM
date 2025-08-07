// server/controllers/sessionControllers.js
const db = require('../db');

exports.createSession = async (req, res) => {
    try {
        console.log('📥 Requête reçue pour session :', req.body);
        const { user_id, status, pause_type, start_time, end_time } = req.body;
        if (status === 'pause' && !pause_type) {
            return res.status(400).json({ message: 'Le type de pause est requis pour une session de pause.' });
        }

        if (!user_id || !status || !start_time) {
            return res.status(400).json({ message: 'Champs requis manquants' });
        }

        // Calculer la durée en secondes si endTime existe
        let duration = null;
        if (end_time) {
            const start = new Date(start_time);
            const end = new Date(end_time);
            duration = Math.floor((end - start) / 1000);
            if (duration < 0) duration = null; // sécurité
        }

        await db.query(
            `INSERT INTO session_agents (user_id, status, pause_type, start_time, end_time, duration)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
            [user_id, status, pause_type || null, start_time, end_time || null, duration]
        );
        res.status(201).json({ message: 'Session enregistrée avec succès' });

    } catch (error) {
        console.error('Erreur enregistrement session :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Fermer la session active 
exports.closeCurrentSession = async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ message: "user_id est requis" });
    }

    // Met à jour la session active (end_time NULL) pour l'utilisateur
    const now = new Date();

    const result = await db.query(
      `UPDATE session_agents
       SET end_time = $1,
           duration = EXTRACT(EPOCH FROM ($1 - start_time))
       WHERE user_id = $2
         AND end_time IS NULL
       RETURNING id`,
      [now, user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Aucune session active trouvée" });
    }

    res.status(200).json({ message: "Session fermée avec succès", session_id: result.rows[0].id });
  } catch (error) {
    console.error('Erreur fermeture session :', error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
