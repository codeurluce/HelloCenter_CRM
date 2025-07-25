// server/controllers/sessionControllers.js
const db = require('../db');

exports.createSession = async (req, res) => {
  try {
    console.log('📥 Requête reçue pour session :', req.body);
    const { user_id, status, start_time, end_time  } = req.body;

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
      `INSERT INTO session_agents (user_id, status, start_time, end_time, duration)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [user_id, status, start_time, end_time || null, duration]
    );
    res.status(201).json({ message: 'Session enregistrée avec succès' });
    
  } catch (error) {
    console.error('Erreur enregistrement session :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
