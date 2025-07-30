const db = require('../db');


// Obtenir les nouvelles fiches par univers
exports.getTodayNewFilesByUniverse = async (req, res) => {
  console.log('👤 Univers de l’utilisateur :', req.user);

  try {
    const agentUniverse = req.user.univers; // exemple: 'Energie' ou 'OffreMobile'
    
    const result = await db.query(`
      SELECT COUNT(*) AS total_files_today
      FROM files
      WHERE statut = 'nouvelle'
        AND univers = $1
        AND DATE(date_creation) = CURRENT_DATE
    `, [agentUniverse]);
                            
    res.json({ total_files_today: result.rows[0].total_files_today });
  } catch (error) {
    console.error('Erreur getTodayNewFilesByUniverse:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};


// export pour traiter une fiche
exports.traiterFiche = async (req, res) => {
  const { id } = req.params;
  const { statut, assignedTo, date_modification, profil } = req.body;

  try {
    console.log('🔧 Reçu pour traitement :', { id, statut, assignedTo, date_modification, profil });

    await db.query(
      'UPDATE files SET statut = $1, agent_id = $2, date_modification = $3, profil = $4, WHERE id = $5',
      [statut, assignedTo, date_modification, profil, id]
    );

    res.status(200).json({ message: 'Fiche mise à jour avec succès' });
  } catch (error) {
    console.error('❌ Erreur serveur lors de la mise à jour de la fiche :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// export pour annuler une fiche
exports.annulerFiche = async (req, res) => {

  const { id } = req.params;
  try {
    await db.query('UPDATE fiches SET statut = $1, agent_id = NULL, date_modification = NOW() WHERE id = $2', ['nouvelle', id]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};