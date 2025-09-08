const db = require('../db');
const XLSX = require("xlsx");
const columnOptions = require("../../client/src/shared/columnsConfig");
const dayjs = require("dayjs");

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
  const oneHourLater = new Date(now.getTime() + 5 * 60 * 1000);

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

// GET API pour obtenir les fiches assignées à l'agent connecté
exports.getFilesbyAgent = async (req, res) => {
  try {
    const agentId = req.user.id;
    const result = await db.query(
      `SELECT * FROM files 
        WHERE assigned_to = $1 
        ORDER BY date_creation ASC`,
      [agentId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des fiches' });
  }
};

// GET API pour obtenir toutes les fiches avec le nom complet de l'agent
exports.getAllFiches = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT f.*,
             COALESCE(
               CONCAT(a.firstname, ' ', a.lastname),
               f.assigned_to_name,
               'Agent inconnu'
             ) AS agent_display_name
      FROM files f
      LEFT JOIN users a ON f.agent_id = a.id
      ORDER BY f.date_creation ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur getAllFiches:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// API pour assigner des fiches à un agent et logué l'admin qui a fait l'action dans la bd
exports.getAssignedFichesTo = async (req, res) => {
  try {
    const { ficheIds, agentId } = req.body;
    const adminId = req.user.id; // l'admin qui fait l'action

    if (!ficheIds || !agentId || ficheIds.length === 0) {
      return res.status(400).json({ error: 'ficheIds et agentId sont obligatoires' });
    }

    // 🔎 Récupérer le nom/prénom du manager (admin)
    let adminName;
    if (!req.user.firstname || !req.user.lastname) {
      const adminRes = await db.query(
        `SELECT firstname, lastname FROM users WHERE id = $1`,
        [adminId]
      );
      const admin = adminRes.rows[0];
      adminName = admin ? `${admin.firstname} ${admin.lastname}` : `ID ${adminId}`;
    } else {
      adminName = `${req.user.firstname} ${req.user.lastname}`;
    }

    // 🔎 Récupérer le nom/prénom de l’agent assigné
    const agentRes = await db.query(
      `SELECT firstname, lastname FROM users WHERE id = $1`,
      [agentId]
    );
    const agent = agentRes.rows[0];
    const agentName = agent ? `${agent.firstname} ${agent.lastname}` : `ID ${agentId}`;

    // 🔄 Mise à jour des fiches
    const result = await db.query(
      `UPDATE files 
       SET assigned_to = $1,
          agent_id = $1, 
           assigned_by = $2,
           statut = 'nouvelle', 
           date_assignation = NOW()
       WHERE id = ANY($3::int[])
       RETURNING id`,
      [agentId, adminId, ficheIds]
    );

    // 📝 Log dans historique_files
    for (const fiche of result.rows) {
      await db.query(
        `INSERT INTO historique_files (fiche_id, action, actor_id, actor_name, commentaire, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          fiche.id,
          'ASSIGNATION',
          adminId,
          adminName,
          `Fiche assignée à l’agent ${agentName}`,
        ]
      );
    }

    return res.json({
      message: `✅ ${result.rowCount} fiche(s) assignée(s) à l’agent ${agentName}`,
      updated: result.rows.map(r => r.id),
    });
  } catch (error) {
    console.error('Erreur assignation:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l’assignation' });
  }
};

// API pour importer des fiches en masse et logué l'admin qui a fait l'import dans la bd
exports.importFiles = async (req, res) => {
  try {
    const { files } = req.body;
    const adminId = req.user?.id;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier à importer' });
    }

    // 🔎 Récupérer le nom/prénom exact du manager (admin)
    let adminName;
    if (!req.user?.firstname || !req.user?.lastname) {
      const adminRes = await db.query(
        `SELECT firstname, lastname FROM users WHERE id = $1`,
        [adminId]
      );
      const admin = adminRes.rows[0];
      adminName = admin ? `${admin.firstname} ${admin.lastname}` : `ID ${adminId}`;
    } else {
      adminName = `${req.user.firstname} ${req.user.lastname}`;
    }

    // Normalisation des textes
    const normalizeText = (str) => (str == null ? null : String(str).normalize("NFC").trim());

    // Préparer les valeurs pour l'insertion
    const insertValues = files.map(f => [
      normalizeText(f.nom_client),
      normalizeText(f.prenom_client),
      normalizeText(f.adresse_client),
      normalizeText(f.code_postal),
      normalizeText(f.mail_client),
      normalizeText(f.numero_mobile),
      normalizeText(f.univers),
      f.statut || 'nouvelle',
      new Date(),
      adminId
    ]);

    // Générer la requête multi-insertion
    const queryText = `
      INSERT INTO files
        (nom_client, prenom_client, adresse_client, code_postal, mail_client, numero_mobile, univers, statut, date_import, imported_by)
      VALUES
        ${insertValues.map((_, i) =>
      `(
            $${i * 10 + 1}, $${i * 10 + 2}, $${i * 10 + 3}, $${i * 10 + 4}, $${i * 10 + 5},
            $${i * 10 + 6}, $${i * 10 + 7}, $${i * 10 + 8}, $${i * 10 + 9}, $${i * 10 + 10}
          )`
    ).join(', ')}
      RETURNING id
    `;

    const flatValues = insertValues.flat();

    // 🔄 Début transaction
    await db.query('BEGIN');

    // Insertion des fichiers
    const result = await db.query(queryText, flatValues);

    // Insertion dans historique_files
    for (const fiche of result.rows) {
      await db.query(
        `INSERT INTO historique_files (
           fiche_id, action, actor_id, actor_name, commentaire, created_at
         ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          fiche.id,
          'IMPORTATION',
          adminId,
          adminName,
          `Fiche importée par ${adminName}`
        ]
      );
    }

    // ✅ Commit transaction
    await db.query('COMMIT');

    return res.json({
      message: `✅ ${result.rowCount} fiche(s) importée(s) avec succès`,
      addedFiches: result.rows.map(r => r.id)
    });


  } catch (error) {
    // 🔄 Rollback si erreur
    await db.query('ROLLBACK');
    console.error('Erreur import:', error);

    if (error.code === '23514') {
      return res.status(400).json({
        error: "⚠️ Univers invalide. Vérifie que la colonne 'univers' contient une valeur autorisée."
      });
    }
    //   if (error.code === "23505") {
    //   return res.status(400).json({ 
    //     error: "Ce client existe déjà (conflit de doublon)." });
    // }
    // if (error.code === "23502") {
    //   return res.status(400).json({ error: "Champs obligatoires manquants." });
    // }
    // if (error.code === "22P02") {
    //   return res.status(400).json({ error: "Format invalide pour certaines données." });
    // }
    res.status(500).json({ error: 'Erreur serveur lors de l’import des fichiers' });
  }
};

// API pour exporter des fiches en XLSX
exports.exportFichesToXLSX = async (req, res) => {
  const columnLabels = Object.fromEntries(columnOptions.map(c => [c.key, c.label]));
  try {
    const {
      agents,     // JSON stringifié: [1, 2, 3]
      columns,    // JSON stringifié: ['id', 'nom_client', ...]
      dateType,   // 'single' | 'range'
      singleDate,
      startDate,
      endDate,
    } = req.query;

    // Requête de base : exclure "nouvelle"
    let query = 'SELECT * FROM files WHERE statut != $1';
    const params = ['nouvelle'];
    let paramIndex = 2;

    // Filtre agents
    if (agents) {
      let agentsArray = JSON.parse(agents).filter(a => a !== null); // enlève null
      if (agentsArray.length > 0) {
        const placeholders = agentsArray.map(() => `$${paramIndex++}`).join(',');
        query += ` AND assigned_to IN (${placeholders})`;
        params.push(...agentsArray);
      }
    }

    // Filtre dates
    if (dateType === 'single' && singleDate) {
      query += ` AND date_creation::date = $${paramIndex}`;
      params.push(singleDate);
      paramIndex++;
    } else if (dateType === 'range' && startDate && endDate) {
      query += ` AND date_creation::date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(startDate, endDate);
      paramIndex += 2;
    }

    // Exécution requête
    const { rows } = await db.query(query, params);


    // appliquer le mapping clé → label
    let dataToExport = rows;
    if (columns) {
      const columnsArray = JSON.parse(columns);
      dataToExport = rows.map(row =>
        columnsArray.reduce((acc, col) => {
          const label = columnLabels[col] || col;
          let value = row[col];

          // formater si c'est une date
          if (value instanceof Date) {
            value = value.toISOString().replace('T', ' ').substring(0, 19);
          }
          acc[label] = row[col];
          return acc;
        }, {})
      );
    }

    // Génération Excel
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fiches");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", 'attachment; filename="export_fiches.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);

  } catch (error) {
    console.error("Erreur export fiches:", error);
    res.status(500).json({ error: "Erreur lors de l’export des fiches" });
  }
};
