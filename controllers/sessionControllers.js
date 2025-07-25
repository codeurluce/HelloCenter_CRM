const db = require('../db');

exports.createSession = async (req, res) => {
  try {
    console.log('📥 Requête reçue pour session :', req.body);
    const { user_id, status, startTime, endTime } = req.body;

    if (!user_id || !status || !startTime || !endTime) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }

    const duration = `('${endTime}'::timestamp - '${startTime}'::timestamp)`;

    await db.query(
      `INSERT INTO sessions (user_id, status, start_time, end_time, duration) 
       VALUES ($1, $2, $3, $4, ${duration})`,
      [user_id, status, startTime, endTime]
    );

    res.status(201).json({ message: 'Session enregistrée avec succès' });
  } catch (error) {
    console.error('Erreur enregistrement session :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
