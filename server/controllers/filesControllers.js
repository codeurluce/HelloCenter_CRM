const db = require('../db');

// Obtenir les nouvelles fiches par
exports.getTodayNewFilesByUniverse = async (req, res) => {
  console.log('👤 Agent connectee :', req.user);

  try {
    const agentFiles = req.user.id; // exemple: 'Energie' ou 'OffreMobile'

    const result = await db.query(`
      SELECT COUNT(*) AS total_files_today
      FROM files
      WHERE statut = 'nouvelle'
        AND assigned_to = $1
    `, [agentFiles]);

    res.json({ total_files_today: result.rows[0].total_files_today });
  } catch (error) {
    console.error('Erreur getTodayNewFilesByUniverse:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// export pour traiter une fiche
exports.traiterFiche = async (req, res) => {
  const { id } = req.params;
  const { statut, assigned_to, date_modification } = req.body;

  try {
    console.log('🔧 Reçu pour traitement :', { id, statut, assigned_to, date_modification });

    // Mise à jour + on récupère la fiche mise à jour
    const result = await db.query(
      `UPDATE files 
       SET statut = $1, assigned_to = $2, date_modification = $3 
       WHERE id = $4
       RETURNING *`,
      [statut, assigned_to, date_modification, id]
    );
    const updatedFiche = result.rows[0];

    // Récupérer nom complet de l'agent
    const agentResult = await db.query(
      `SELECT lastname, firstname FROM users WHERE id = $1`,
      [assigned_to]
    );
    const user = agentResult.rows[0];
    const assigned_to_name = user ? `${user.lastname} ${user.firstname}` : null;

    res.status(200).json({
      ...updatedFiche,
      assigned_to_name,
    });
  } catch (error) {
    console.error('❌ Erreur serveur lors de la mise à jour de la fiche :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// export pour annuler une fiche
exports.annulerFiche = async (req, res) => {
  const { id } = req.params;

  try {
    // On ne touche pas à agent_id : on le garde
    await db.query(
      'UPDATE files SET statut = $1, date_modification = NOW() WHERE id = $2',
      ['nouvelle', id]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};



// export pour clôturer une fiche
exports.cloturerFiche = async (req, res) => {
  const { id } = req.params;
  const { tag, commentaire, date_modification } = req.body;

  try {
    await db.query(
      `UPDATE files 
       SET statut = 'cloturee', tag = $1, commentaire = $2, date_modification = $3 
       WHERE id = $4`,
      [tag, commentaire, date_modification, id]
    );
    res.status(200).json({ message: 'Fiche clôturée avec succès' });
  } catch (err) {
    console.error('Erreur clôture fiche :', err);
    res.sendStatus(500);
  }
};


// Export pour prendre un rendez-vous
exports.programRdv = async (req, res) => {
  const { id } = req.params;
  const { rendez_vous_date, rendez_vous_commentaire } = req.body;

  try {
    await db.query(
      `UPDATE files 
   SET rendez_vous_date = $1, 
       rendez_vous_commentaire = $2,
       statut = 'rendez_vous',
       date_modification = NOW()
   WHERE id = $3`,
      [rendez_vous_date, rendez_vous_commentaire, id]
    );
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur lors de la mise à jour du rendez-vous');
  }
};

//  Export pour recuperer toutes les fiches en RDV 
exports.getFilesToRDV = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM files 
        WHERE statut = 'rendez_vous'
       ORDER BY rendez_vous_date ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des fiches en RDV :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}


// GET /api/rendezvous/upcoming/:agentId
exports.getUpcomingRendezVous = async (req, res) => {
  const { agentId } = req.params;
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 2 * 60 * 1000);

  try {
    const result = await db.query(
      `SELECT id, nom_client, prenom_client, rendez_vous_date 
       FROM files 
       WHERE assigned_to = $1 
         AND statut = 'rendez_vous' 
         AND rendez_vous_date BETWEEN $2 AND $3`,
      [agentId, now.toISOString(), oneHourLater.toISOString()]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de la récupération des rendez-vous');
  }
};
