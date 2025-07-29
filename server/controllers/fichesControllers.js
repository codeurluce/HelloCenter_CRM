const db = require('../db');

exports.traiterFiche = async (req, res) => {
  const { id } = req.params;
  const { statut, assignedTo, date_modification } = req.body;

  try {
    console.log('🔧 Reçu pour traitement :', { id, statut, assignedTo, date_modification });

    await db.query(
      'UPDATE files SET statut = $1, agent_id = $2, date_modification = $3 WHERE id = $4',
      [statut, assignedTo, date_modification, id]
    );

    res.status(200).json({ message: 'Fiche mise à jour avec succès' });
  } catch (error) {
    console.error('❌ Erreur serveur lors de la mise à jour de la fiche :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
