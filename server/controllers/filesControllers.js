const db = require("../db");
const XLSX = require("xlsx");
const columnOptions = require("../shared/columnsConfig");
const dayjs = require("dayjs");

// Obtenir les nouvelles fiches avec le statut nouvelle
exports.getNewFilesCountByAgent = async (req, res) => {
  try {
    const agentFiles = req.user.id; // exemple: 'Energie' ou 'OffreMobile'
    const siteId = req.siteId;

    const result = await db.query(
      `
      SELECT COUNT(*) AS total_files_today
      FROM files
      WHERE statut = 'nouvelle'
        AND assigned_to = $1
        AND site_id = $2
    `,
      [agentFiles, siteId]
    );

    res.json({ total_files_today: result.rows[0].total_files_today });
  } catch (error) {
    console.error("Erreur getTodayNewFilesByUniverse:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// obtenir le nombre total de nouvelles fiches (statut = nouvelle) pour l'admin
exports.getAdminFilesSummary = async (req, res) => {
  try {
    const siteId = req.siteId;
    const result = await db.query(
      `
      SELECT COUNT(*) AS total_files_today
      FROM files
      WHERE statut = 'nouvelle'
    AND site_id = $1
      `,
      [siteId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erreur getAdminFilesSummary:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// export pour traiter une fiche
exports.traiterFiche = async (req, res) => {
  const { id } = req.params;
  const { statut, assigned_to, date_modification } = req.body;

  try {
    console.log("🔧 Reçu pour traitement :", {
      id,
      statut,
      assigned_to,
      date_modification,
    });

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
    const assigned_to_name = user ? `${user.firstname} ${user.lastname}` : null;

    res.status(200).json({
      ...updatedFiche,
      assigned_to_name,
    });
  } catch (error) {
    console.error(
      "❌ Erreur serveur lors de la mise à jour de la fiche :",
      error
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// export pour annuler une fiche
exports.annulerFiche = async (req, res) => {
  const { id } = req.params;

  try {
    // On ne touche pas à agent_id : on le garde
    await db.query(
      "UPDATE files SET statut = $1, date_modification = NOW() WHERE id = $2",
      ["nouvelle", id]
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
    res.status(200).json({ message: "Fiche clôturée avec succès" });
  } catch (err) {
    console.error("Erreur clôture fiche :", err);
    res.sendStatus(500);
  }
};

// Enregistrer tag + commentaire SANS modifier le statut
exports.enregistrerFicheSansCloture = async (req, res) => {
  const { id } = req.params;
  const { tag, commentaire, date_modification } = req.body;

  try {
    await db.query(
      `UPDATE files
       SET tag = $1,
           commentaire = $2,
           date_modification = $3
       WHERE id = $4`,
      [tag, commentaire, date_modification, id]
    );

    res.status(200).json({ message: "Fiche mise à jour avec succès" });
  } catch (err) {
    console.error("Erreur mise à jour fiche :", err);
    res.sendStatus(500);
  }
};

// Export pour prendre un rendez-vous
exports.programRdv = async (req, res) => {
  const { id } = req.params;
  const { rendez_vous_date, rendez_vous_commentaire, tag } = req.body;

  try {
    await db.query(
      `UPDATE files 
   SET rendez_vous_date = $1, 
       rendez_vous_commentaire = $2,
       tag = $3,
       statut = 'rendez_vous',
       date_modification = NOW()
   WHERE id = $4`,
      [rendez_vous_date, rendez_vous_commentaire, tag, id]
    );
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la mise à jour du rendez-vous");
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
    console.error("Erreur lors de la récupération des fiches en RDV :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// GET /api/rendezvous/upcoming/:agentId
exports.getUpcomingRendezVous = async (req, res) => {
  const { agentId } = req.params;
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 5 * 60 * 1000);

  try {
    const result = await db.query(
      `SELECT id, nom_client, prenom_client, rendez_vous_date, rendez_vous_commentaire 
       FROM files 
       WHERE assigned_to = $1 
         AND statut = 'rendez_vous' 
         AND rendez_vous_date BETWEEN $2 AND $3
         ORDER BY rendez_vous_date ASC`,
      [agentId, now.toISOString(), oneHourLater.toISOString()]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la récupération des rendez-vous");
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
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération des fiches" });
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
    console.error("Erreur getAllFiches:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// API pour assigner des fiches à un agent et logué l'admin qui a fait l'action dans la bd
exports.getAssignedFichesTo = async (req, res) => {
  try {
    const { ficheIds, agentId } = req.body;
    const adminId = req.user.id; // admin qui fait l'action
    const userRole = req.user.role;
    const siteId = req.siteId; // injecté par middleware siteScope

    if (!ficheIds || !agentId || ficheIds.length === 0) {
      return res
        .status(400)
        .json({ error: "ficheIds et agentId sont obligatoires" });
    }

    // 🔎 Récupérer le nom/prénom du manager (admin)
    let adminName;
    if (!req.user.firstname || !req.user.lastname) {
      const adminRes = await db.query(
        `SELECT firstname, lastname FROM users WHERE id = $1`,
        [adminId]
      );
      const admin = adminRes.rows[0];
      adminName = admin
        ? `${admin.firstname} ${admin.lastname}`
        : `ID ${adminId}`;
    } else {
      adminName = `${req.user.firstname} ${req.user.lastname}`;
    }

    // 🔎 Récupérer l’agent assigné avec restriction site si Admin
    let query = `SELECT id, firstname, lastname FROM users WHERE id = $1`;
    const params = [agentId];

    if (userRole === "Admin") {
      query += ` AND site_id = $2`;
      params.push(siteId);
    }

    const agentRes = await db.query(query, params);
    const agent = agentRes.rows[0];

    if (!agent) {
      return res.status(403).json({
        error:
          "Vous ne pouvez pas assigner à cet agent (il n'est pas sur votre site ou n'existe pas)",
      });
    }

    const agentName = `${agent.firstname} ${agent.lastname}`;

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
          "ASSIGNATION",
          adminId,
          adminName,
          `Fiche assignée à l’agent ${agentName}`,
        ]
      );
    }

    return res.json({
      message: `✅ ${result.rowCount} fiche(s) assignée(s) à l’agent ${agentName}`,
      updated: result.rows.map((r) => r.id),
    });
  } catch (error) {
    console.error("Erreur assignation:", error);
    res.status(500).json({ error: "Erreur serveur lors de l’assignation" });
  }
};

// retirer assignation d'une fiche et nettoyer le tag si nécessaire
exports.unassignFiches = async (req, res) => {
  try {
    const { ficheIds } = req.body;
    const adminId = req.user.id;

    if (!ficheIds || ficheIds.length === 0) {
      return res.status(400).json({ error: "ficheIds est obligatoire" });
    }

    // 🔎 Nom de l'admin
    let adminName;
    if (!req.user.firstname || !req.user.lastname) {
      const adminRes = await db.query(
        `SELECT firstname, lastname FROM users WHERE id = $1`,
        [adminId]
      );
      const admin = adminRes.rows[0];
      adminName = admin
        ? `${admin.firstname} ${admin.lastname}`
        : `ID ${adminId}`;
    } else {
      adminName = `${req.user.firstname} ${req.user.lastname}`;
    }

    // 🔎 Récupérer les fiches à désassigner (avec tag et commentaire)
    const fichesRes = await db.query(
      `SELECT id, assigned_to, statut, tag, commentaire FROM files WHERE id = ANY($1::int[])`,
      [ficheIds]
    );

    if (fichesRes.rows.length === 0) {
      return res.status(404).json({ error: "Aucune fiche trouvée." });
    }

    // 🔎 Récupération noms des agents assignés
    const agentIds = [
      ...new Set(fichesRes.rows.map((f) => f.assigned_to).filter(Boolean)),
    ];
    const agentsMap = {};
    if (agentIds.length > 0) {
      const agentsRes = await db.query(
        `SELECT id, firstname, lastname FROM users WHERE id = ANY($1::int[])`,
        [agentIds]
      );
      for (const a of agentsRes.rows) {
        agentsMap[a.id] = `${a.firstname} ${a.lastname}`;
      }
    }

    // 🔄 Mise à jour des fiches → suppression assignation, reset tag et commentaire si cloturée
    const result = await db.query(
      `UPDATE files
       SET assigned_to = NULL,
           agent_id = NULL,
           assigned_by = NULL,
           assigned_to_name = NULL,
           assigned_by_name = NULL,
           statut = 'nouvelle',
           tag = CASE WHEN statut = 'cloturee' THEN NULL ELSE tag END,
           commentaire = CASE WHEN statut = 'cloturee' THEN NULL ELSE commentaire END,
           date_assignation = NULL
       WHERE id = ANY($1::int[])
       RETURNING id`,
      [ficheIds]
    );

    // 📝 Log dans historique_files
    for (const fiche of fichesRes.rows) {
      const oldAgentId = fiche.assigned_to;
      const oldAgentName = oldAgentId ? agentsMap[oldAgentId] : "Agent inconnu";

      const oldTag = fiche.tag;
      const oldCommentaire = fiche.commentaire;

      const commentaireLog = `Assignation retirée à : ${oldAgentName}. Fiche remise au statut 'nouvelle'${
        fiche.statut.toLowerCase() === 'cloturee' && oldTag
          ? `, tag: "${oldTag}" supprimé et commentaire: "${oldCommentaire}" supprimé`
          : ''
      }.`;  

      await db.query(
        `INSERT INTO historique_files (fiche_id, action, actor_id, actor_name, commentaire, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [fiche.id, "UNASSIGNATION", adminId, adminName, commentaireLog]
      );
    }

    return res.json({
      message: `♻️ ${result.rowCount} fiche(s) désassignée(s) avec succès.`,
      updated: result.rows.map((r) => r.id),
    });
  } catch (error) {
    console.error("Erreur unassign:", error);
    res.status(500).json({ error: "Erreur serveur lors de la désassignation" });
  }
};

// API pour importer des fiches en masse et logué l'admin qui a fait l'import dans la bd
exports.importFiles = async (req, res) => {
  try {
    const { files } = req.body;
    const adminId = req.user?.id;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "Aucun fichier à importer" });
    }

    // 🔎 Récupérer le nom/prénom exact du manager (admin)
    let adminName;
    if (!req.user?.firstname || !req.user?.lastname) {
      const adminRes = await db.query(
        `SELECT firstname, lastname FROM users WHERE id = $1`,
        [adminId]
      );
      const admin = adminRes.rows[0];
      adminName = admin
        ? `${admin.firstname} ${admin.lastname}`
        : `ID ${adminId}`;
    } else {
      adminName = `${req.user.firstname} ${req.user.lastname}`;
    }

    // Normalisation des textes
    const normalizeText = (str) =>
      str == null ? null : String(str).normalize("NFC").trim();

    // Validation stricte des numéros PDL et PCE
    for (const [index, f] of files.entries()) {
      const pdlClean = f.pdl != null ? String(f.pdl).replace(/\s/g, "") : null;
      const pceClean = f.pce != null ? String(f.pce).replace(/\s/g, "") : null;

      if (pdlClean && !/^\d{1,14}$/.test(pdlClean)) {
        return res.status(400).json({
          error: `Format invalide dans la colonne PDL à la ligne ${
            index + 1
          }. Doit contenir 1 à 14 chiffres sans espaces.`,
        });
      }

      if (pceClean && !/^\d{1,14}$/.test(pceClean)) {
        return res.status(400).json({
          error: `Format invalide dans la colonne PCE à la ligne ${
            index + 1
          }. Doit contenir 1 à 14 chiffres sans espaces.`,
        });
      }
    }

    // Préparer les valeurs pour l'insertion
    const insertValues = files.map((f) => [
      normalizeText(f.nom_client),
      normalizeText(f.prenom_client),
      normalizeText(f.adresse_client),
      normalizeText(f.code_postal),
      normalizeText(f.mail_client),
      normalizeText(f.numero_mobile),
      normalizeText(f.univers),
      normalizeText(f.numero_fixe),
      normalizeText(f.ville_client),
      normalizeText(f.pdl != null ? String(f.pdl).replace(/\s/g, "") : null),
      normalizeText(f.pce != null ? String(f.pce).replace(/\s/g, "") : null),
      f.statut || "nouvelle",
      new Date(),
      adminId,
    ]);

    // Générer la requête multi-insertion
    const queryText = `
      INSERT INTO files
        (nom_client, prenom_client, adresse_client, code_postal, mail_client, numero_mobile, univers, numero_fixe, ville_client, pdl, pce, statut, date_import, imported_by)
      VALUES
        ${insertValues
          .map(
            (_, i) =>
              `(
            $${i * 14 + 1}, $${i * 14 + 2}, $${i * 14 + 3}, $${i * 14 + 4}, $${
                i * 14 + 5
              },
            $${i * 14 + 6}, $${i * 14 + 7}, $${i * 14 + 8}, $${i * 14 + 9}, $${
                i * 14 + 10
              },
            $${i * 14 + 11}, $${i * 14 + 12}, $${i * 14 + 13}, $${i * 14 + 14}
          )`
          )
          .join(", ")}
      RETURNING id
    `;

    const flatValues = insertValues.flat();

    // Début transaction
    await db.query("BEGIN");

    // Insertion des fichiers
    const result = await db.query(queryText, flatValues);

    if (!result.rowCount || result.rowCount === 0) {
      await db.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Aucune fiche n’a été importée.",
        addedFiches: [],
      });
    }

    // Insertion dans historique_files
    for (const fiche of result.rows) {
      await db.query(
        `INSERT INTO historique_files (
           fiche_id, action, actor_id, actor_name, commentaire, created_at
         ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          fiche.id,
          "IMPORTATION",
          adminId,
          adminName,
          `Fiche importée par ${adminName}`,
        ]
      );
    }

    // Commit transaction
    await db.query("COMMIT");

    return res.json({
      success: true,
      message: `✅ ${result.rowCount} fiche(s) importée(s) avec succès`,
      addedFiches: result.rows.map((r) => r.id),
    });
  } catch (error) {
    // Rollback en cas d'erreur
    await db.query("ROLLBACK");
    console.error("Erreur import:", error);

    if (error.code === "23514") {
      return res.status(400).json({
        error:
          "⚠️ Univers invalide. Vérifie que la colonne 'univers' contient une valeur autorisée.",
      });
    }
    // if (error.code === "23505") {
    //   return res.status(400).json({ error: "Ce client existe déjà (conflit de doublon)." });
    // }
    // if (error.code === "23502") {
    //   return res.status(400).json({ error: "Champs obligatoires manquants." });
    // }
    if (error.code === "22P02") {
      return res
        .status(400)
        .json({
          error:
            "Format invalide pour certaines données, vérifier les colonnes PDL et PCE.",
        });
    }
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de l’import des fichiers" });
  }
};

// API pour exporter des fiches en XLSX
exports.exportFichesToXLSX = async (req, res) => {
  const columnLabels = Object.fromEntries(
    columnOptions.map((c) => [c.key, c.label])
  );
  try {
    const {
      agents, // JSON stringifié: [1, 2, 3]
      columns, // JSON stringifié: ['id', 'nom_client', ...]
      dateType, // 'single' | 'range'
      singleDate,
      startDate,
      endDate,
    } = req.query;

    // Requête de base : exclure "nouvelle"
    let query = "SELECT * FROM files WHERE 1 = 1";
    const params = [];
    let paramIndex = 1;

    // Filtre agents
    if (agents) {
      let agentsArray = JSON.parse(agents).filter((a) => a !== null); // enlève null
      if (agentsArray.length > 0) {
        const placeholders = agentsArray
          .map(() => `$${paramIndex++}`)
          .join(",");
        query += ` AND assigned_to IN (${placeholders})`;
        params.push(...agentsArray);
      }
    }

    // Filtre dates
    if (dateType === "single" && singleDate) {
      query += ` AND date_creation::date = $${paramIndex}`;
      params.push(singleDate);
      paramIndex++;
    } else if (dateType === "range" && startDate && endDate) {
      query += ` AND date_creation::date BETWEEN $${paramIndex} AND $${
        paramIndex + 1
      }`;
      params.push(startDate, endDate);
      paramIndex += 2;
    }

    // Exécution requête
    const { rows } = await db.query(query, params);

    // appliquer le mapping clé → label
    let dataToExport = rows;
    if (columns) {
      const columnsArray = JSON.parse(columns);
      dataToExport = rows.map((row) =>
        columnsArray.reduce((acc, col) => {
          const label = columnLabels[col] || col;
          let value = row[col];

          // formater si c'est une date
          if (value instanceof Date) {
            value = value.toISOString().replace("T", " ").substring(0, 19);
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
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="export_fiches.xlsx"'
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Erreur export fiches:", error);
    res.status(500).json({ error: "Erreur lors de l’export des fiches" });
  }
};

// Supprimer une fiche
exports.deleteFile = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM files WHERE id = $1", [id]);
    return res.status(200).json({ message: "Fiche supprimée avec succès" });
  } catch (error) {
    console.error("Erreur suppression fiche:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

// Suppression de plusieurs fiches à la fois
// Supprimer un lot de fiches
exports.deleteFilesBatch = async (req, res) => {
  const { ficheIds } = req.body; // ⚠️ on récupère ficheIds pour matcher le frontend

  // Vérification sécurisée
  if (!Array.isArray(ficheIds) || ficheIds.length === 0) {
    return res
      .status(400)
      .json({ error: "ficheIds est requis et doit être un tableau non vide." });
  }

  try {
    // Suppression en batch
    const result = await db.query(
      `DELETE FROM files WHERE id = ANY($1::int[])`,
      [ficheIds]
    );

    return res.status(200).json({
      message: `${result.rowCount} fiche(s) supprimée(s) avec succès.`,
    });
  } catch (err) {
    console.error("Erreur suppression batch:", err);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la suppression" });
  }
};
