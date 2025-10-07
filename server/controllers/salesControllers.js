const db = require('../db');
const { logSaleHistory, getActorName } = require('../salesHistory');

// Notez bien que:
//   pending: 'signifie les ventes de l'agent',
//   validated: 'signifie les ventes qui sont payes à l'agent',
//   cancelled: 'signifie les ventes qui sont annules',


// Récupère le nombre total de ventes du jour pour l'agent connecté, et le nombre total de fichiers "nouvelle" assignés à cet agent.
exports.getTodaySummary = async (req, res) => {
  try {
    const agentId = req.user.id;

    const result = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'validated') AS validated,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
        COUNT(*) AS total
      FROM sales
      WHERE DATE(created_at) = CURRENT_DATE
        AND agent_id = $1
    `, [agentId]);

    const filesTotal = await db.query(`
      SELECT 
        COUNT(*) AS total_files_today
      FROM files
      WHERE statut = 'nouvelle'
        AND assigned_to = $1
    `, [agentId]);

    res.json({
      total_sales_today: result.rows[0].total,
      pending_sales_today: result.rows[0].pending,
      validated_sales_today: result.rows[0].validated,
      cancelled_sales_today: result.rows[0].cancelled,
      total_files_today: filesTotal.rows[0].total_files_today
    });

  } catch (err) {
    console.error('Erreur getTodaySummary:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Recupere le nombre total de ventes par jour pour l'admin
exports.getAdminSalesSummary = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) AS total_sales_today,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_sales_today,
        COUNT(*) FILTER (WHERE status = 'validated') AS validated_sales_today,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_sales_today
      FROM sales
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erreur getAdminSalesSummary:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Récupère, pour l'agent connecté, le nombre de ventes validées chaque jour depuis le début de la semaine en cours.
exports.getWeeklySales = async (req, res) => {
  try {
    const agentId = req.user.id;

    const query = `
      SELECT 
  TO_CHAR(created_at, 'Dy') AS day, -- ex: 'Mon', 'Tue', 'Wed'
  DATE(created_at) AS date,
  COUNT(*) AS validated_sales
FROM sales
WHERE agent_id = $1  -- uniquement les ventes de l'agent(pendind/accord/vendu)
  AND created_at >= date_trunc('week', CURRENT_DATE)
  AND created_at < date_trunc('week', CURRENT_DATE) + interval '7 days'
GROUP BY day, date
ORDER BY date;
    `;

    const { rows } = await db.query(query, [agentId]);
    res.json(rows);

  } catch (error) {
    console.error('Erreur getWeeklySales:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupère les ventes hebdomadaires de tous les agents pour l'adamin
exports.getWeeklySalesAllAgents = async (req, res) => {
  try {
    const query = `
      SELECT 
        TO_CHAR(created_at, 'Dy') AS day,
        COUNT(*) AS validated_sales
      FROM sales
      WHERE created_at >= date_trunc('week', CURRENT_DATE)
        AND created_at < date_trunc('week', CURRENT_DATE) + interval '7 days'
      GROUP BY day
  ORDER BY MIN(created_at)
      `;
    const { rows } = await db.query(query);

    // Transforme pour frontend
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const result = days.map(day => {
      const found = rows.find(r => r.day === day);
      return { day, ventes: found ? parseInt(found.validated_sales, 10) : 0 };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Résumé hebdo par agent (empilé par jour)
exports.getAgentsWeeklySales = async (req, res) => {
  try {
    const query = `
      SELECT 
        name_agent,
        TO_CHAR(created_at, 'Dy') AS day,
        COUNT(*) AS validated_sales
      FROM sales
      WHERE created_at >= date_trunc('week', CURRENT_DATE)
        AND created_at < date_trunc('week', CURRENT_DATE) + interval '7 days'
      GROUP BY name_agent, day
      ORDER BY name_agent, day;
    `;
    const { rows } = await db.query(query);

    const result = {};
    rows.forEach(row => {
      if (!result[row.name_agent]) result[row.name_agent] = {};
      result[row.name_agent][row.day] = parseInt(row.validated_sales, 10);
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Résumé mensuel par semaine pour manager/admin
exports.getMonthlySalesAllAgents = async (req, res) => {
  try {
    const query = `
      SELECT 
        EXTRACT(WEEK FROM created_at) AS week_number,
        COUNT(*) AS validated_sales
      FROM sales
      WHERE created_at >= date_trunc('month', CURRENT_DATE)
        AND created_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
      GROUP BY week_number
      ORDER BY week_number;
    `;

    const { rows } = await db.query(query);

    // Transformation frontend-friendly
    const formatted = rows.map(r => ({
      week: `Semaine ${r.week_number}`,
      ventes: parseInt(r.validated_sales, 10),
    }));

    res.json(formatted);

  } catch (error) {
    console.error('Erreur getMonthlySalesAllAgents:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ✅ Résumé mensuel groupé par agent et par jour
exports.getAgentsMonthlySales = async (req, res) => {
  try {
    const query = `
      SELECT 
        name_agent,
        EXTRACT(WEEK FROM created_at) AS week_number,
        TO_CHAR(created_at, 'Dy') AS day,
        COUNT(*) AS validated_sales
      FROM sales
      WHERE created_at >= date_trunc('month', CURRENT_DATE)
        AND created_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
      GROUP BY name_agent, week_number, day
      ORDER BY name_agent, week_number, day;
    `;
    const { rows } = await db.query(query);

    const result = {};

    rows.forEach(row => {
      const agent = row.name_agent;
      const weekLabel = `Semaine ${row.week_number}`;
      const day = row.day;

      if (!result[agent]) result[agent] = {};
      if (!result[agent][weekLabel]) result[agent][weekLabel] = { Mon:0, Tue:0, Wed:0, Thu:0, Fri:0 };

      result[agent][weekLabel][day] = parseInt(row.validated_sales, 10);
    });

    res.json(result);
  } catch (error) {
    console.error('Erreur getAgentsMonthlySales:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupère toutes les ventes dans la base, avec les informations des agents associés (prénom, nom), triées par date de création décroissante.
exports.getAllSales = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.*, 
              u.firstname AS agent_firstname, 
              u.lastname AS agent_name
       FROM sales s
       LEFT JOIN users u ON u.id = s.agent_id
       ORDER BY s.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur getSales:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Export pour recuperer les ventes dans la base de données de l'agent connecté
exports.getSales = async (req, res) => {
  try {
    const agentId = req.user.id;
    const result = await db.query(
      'SELECT * FROM sales WHERE agent_id = $1 ORDER BY created_at DESC',
      [agentId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur getSales:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// Export pour recuperer une vente par son ID
exports.getSaleById = async (req, res) => {
  try {
    const saleId = req.params.id;
    const agentId = req.user.id; // Empêche de voir les ventes d’un autre agent

    const result = await db.query('SELECT * FROM sales WHERE id = $1 AND agent_id = $2',
      [saleId, agentId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Vente introuvable' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur getSaleById:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// pour les fichiers uploadés
const multer = require('multer');
const path = require('path');
// Configuration upload fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },// Dossier de destination  
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname)); // Nom du fichier
  }
});
const upload = multer({ storage });

//Export pour creer et enregistrer une vente
exports.createSale = async (req, res) => {
  try {
    const agentId = req.user.id;
    const actorName = await getActorName(req); // récupère le nom de l’agent/admin

    const {
      civilite,
      nomClient: client_name,
      prenomClient: client_firstname,
      emailClient: client_email,
      numMobile: client_phone,
      numFixe: client_phone_fix,
      villeClient: ville_client,
      adresseClient: adresse_client,
      codePostal: code_postal_client,
      refClient: ref_client,
      refContrat: ref_contrat,
      energie,
      pdl,
      pce,
      natureOffre: nature_offre,
      puissanceCompteur: puissance_compteur,
      partenaire,
      etatContrat: etat_contrat,
      status = 'pending',
      product_type,

      // Champs spécifiques pour les offres Mobile
      free_agent_account,
      ancienOperateur,
      pto,
      optionSmartphone,
      autresOptions,
      engagement,
      typeTechnologie,
      prixOffre,
      provenanceFichier,
      iban,
      rio,
      etat_cmd,
      ref_cmd,
    } = req.body;

    const fichier = req.file ? req.file.filename : null;
    const engagementBool = engagement === true || engagement === 'true';

    const result = await db.query(
      `
      INSERT INTO sales (
        agent_id, status, partenaire, civilite, client_name, client_firstname, client_email,
        client_phone, client_phone_fix, ville_client, adresse_client, code_postal_client, ref_client, ref_contrat,
        energie, pdl, pce, nature_offre, puissance_compteur, etat_contrat, fichier, product_type, free_agent_account,
        ancien_operateur, pto, option_smartphone, autres_options, engagement, type_technologie, prix_offre, provenance_fichier, 
        iban, rio, etat_cmd, ref_cmd
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
        $31,$32,$33,$34,$35
      ) RETURNING *;
    `,
      [
        agentId, status, partenaire, civilite, client_name, client_firstname, client_email,
        client_phone, client_phone_fix || null, ville_client, adresse_client, code_postal_client, ref_client, ref_contrat || null,
        energie, pdl || null, pce || null, nature_offre, puissance_compteur, etat_contrat, fichier, product_type, free_agent_account,
        ancienOperateur, pto, optionSmartphone || null, autresOptions || null, engagementBool, typeTechnologie, prixOffre, provenanceFichier,
        iban || null, rio || null, etat_cmd || null, ref_cmd || null
      ]
    );

    // log dans sales_history
    await logSaleHistory({
      saleId: result.rows[0].id,
      action: 'CREATION',
      actorId: agentId,
      actorName,
      commentaire: 'Vente créée'
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur createSale:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Export pour supprimer une vente
exports.deleteSale = async (req, res) => {
  try {
    const saleId = req.params.id;

    // 1️⃣ Récupérer la vente avant suppression pour le log
    const oldSaleRes = await db.query('SELECT * FROM sales WHERE id = $1', [saleId]);
    if (oldSaleRes.rows.length === 0) {
      return res.status(404).json({ message: 'Vente non trouvée' });
    }
    const oldSale = oldSaleRes.rows[0];

    console.log("logSaleHistory suppression:", saleId, oldSale);
    // 3️⃣ Log dans sales_history
    await logSaleHistory({
      saleId,
      action: 'SUPPRESSION',
      actorId: req.user.id,
      actorName: await getActorName(req),
      oldValue: oldSale, // 🔹 ici on garde l'état avant suppression
      newValue: null,    // 🔹 après suppression, plus rien
      commentaire: `Vente supprimée: client ${oldSale.client_name} ${oldSale.client_firstname}`
    });

    console.log('Log enregistré pour suppression de la vente', saleId);

    // 2️⃣ Supprimer la vente
    const result = await db.query(
      'DELETE FROM sales WHERE id = $1 RETURNING *',
      [saleId]
    );

    res.json({ message: 'Vente supprimée avec succès', sale: result.rows[0] });
  } catch (error) {
    console.error('Erreur deleteSale:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Export pour mettre à jour une vente energie
exports.updateSale = async (req, res) => {
  try {
    const saleId = req.params.id;

    const oldSaleRes = await db.query('SELECT * FROM sales WHERE id=$1', [saleId]);
    if (oldSaleRes.rows.length === 0) {
      return res.status(404).json({ message: "Vente non trouvée" });
    }
    const oldSale = oldSaleRes.rows[0];

    const {
      civilite,
      nomClient: client_name,
      prenomClient: client_firstname,
      emailClient: client_email,
      numMobile: client_phone,
      numFixe: client_phone_fix,
      villeClient: ville_client,
      adresseClient: adresse_client,
      codePostal: code_postal_client,
      refClient: ref_client,
      refContrat: ref_contrat,
      energie,
      pdl,
      pce,
      natureOffre: nature_offre,
      puissanceCompteur: puissance_compteur,
      partenaire,
      etatContrat: etat_contrat,
      status = 'pending',
      fichier
    } = req.body;

    const result = await db.query(
      `UPDATE sales 
       SET 
         civilite = $1,        client_name = $2,          client_firstname = $3,         client_email = $4,
         client_phone = $5,         client_phone_fix = $6,         ville_client = $7,
         adresse_client = $8,         code_postal_client = $9,         ref_client = $10,
         ref_contrat = $11,         energie = $12,         pdl = $13,
         pce = $14,         nature_offre = $15,         puissance_compteur = $16,
         partenaire = $17,         etat_contrat = $18,         status = $19,
         fichier = $20,         updated_at = NOW()
       WHERE id = $21
       RETURNING *`,
      [
        civilite,
        client_name,
        client_firstname,
        client_email,
        client_phone,
        client_phone_fix,
        ville_client,
        adresse_client,
        code_postal_client,
        ref_client,
        ref_contrat,
        energie,
        pdl,
        pce,
        nature_offre,
        puissance_compteur,
        partenaire,
        etat_contrat,
        status,
        fichier,
        saleId
      ]
    );

    const newSale = result.rows[0];


    // Champs à vérifier pour le log
    const fieldsToCheck = [
      'civilite', 'nomClient', 'prenomClient', 'emailClient', 'numMobile', 'numFixe',
      'villeClient', 'adresseClient', 'codePostal', 'refClient', 'refContrat',
      'energie', 'pdl', 'pce', 'natureOffre', 'puissanceCompteur', 'partenaire', 'etatContrat', 'status', 'fichier'
    ];

    const keyMap = {
      nomClient: 'client_name',
      prenomClient: 'client_firstname',
      emailClient: 'client_email',
      numMobile: 'client_phone',
      numFixe: 'client_phone_fix',
      villeClient: 'ville_client',
      adresseClient: 'adresse_client',
      codePostal: 'code_postal_client',
      refClient: 'ref_client',
      refContrat: 'ref_contrat',
      natureOffre: 'nature_offre',
      puissanceCompteur: 'puissance_compteur',
      etatContrat: 'etat_contrat'
    };

    // Calculer les champs modifiés
    const modifiedFields = fieldsToCheck
      .map(f => {
        const dbKey = keyMap[f] || f;
        if (oldSale[dbKey] != req.body[f]) {
          return `${f}: "${oldSale[dbKey]}" → "${req.body[f]}"`;
        }
        return null;
      })
      .filter(Boolean);

    // Log dans sales_history si champs modifiés
    if (modifiedFields.length) {
      await logSaleHistory({
        saleId,
        action: 'MODIFICATION',
        actorId: req.user.id,
        actorName: await getActorName(req),
        commentaire: modifiedFields.join(', '),
      });
    }
    res.status(200).json(newSale);

  } catch (error) {
    console.error("Erreur lors de la mise à jour de la vente :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// Export pour mettre à jour une vente Mobile
exports.updateSaleMobile = async (req, res) => {
  try {
    const saleId = req.params.id;

    const oldSaleRes = await db.query('SELECT * FROM sales WHERE id=$1', [saleId]);
    if (oldSaleRes.rows.length === 0) {
      return res.status(404).json({ message: "Vente non trouvée" });
    }
    const oldSale = oldSaleRes.rows[0];

    const {
      civilite,
      nomClient,
      prenomClient,
      emailClient,
      numMobile,
      numFixe,
      villeClient,
      adresseClient,
      codePostal,
      engagement,
      typeTechnologie,
      prixOffre,
      prixOffreAutre,
      ancienOperateur,
      pto,
      optionSmartphone,
      autresOptions,
      rio,
      iban,
      provenanceFichier,
      free_agent_account,
      etat_cmd,
      ref_cmd,
      status = "pending",
    } = req.body;

    const finalPrixOffre = prixOffre === "Autre" ? prixOffreAutre : prixOffre;

    const result = await db.query(
      `UPDATE sales SET 
        civilite = $1,
        client_name = $2,
        client_firstname = $3,
        client_email = $4,
        client_phone = $5,
        client_phone_fix = $6,
        ville_client = $7,
        adresse_client = $8,
        code_postal_client = $9,
        engagement = $10,
        type_technologie = $11,
        prix_offre = $12,
        ancien_operateur = $13,
        pto = $14,
        option_smartphone = $15,
        autres_options = $16,
        rio = $17,
        iban = $18,
        provenance_fichier = $19,
        free_agent_account = $20,
        etat_cmd = $21,
        ref_cmd = $22,
        status = $23,
        updated_at = NOW()
      WHERE id = $24
      RETURNING *`,
      [
        civilite,
        nomClient,
        prenomClient,
        emailClient,
        numMobile,
        numFixe,
        villeClient,
        adresseClient,
        codePostal,
        engagement,
        typeTechnologie,
        finalPrixOffre,
        ancienOperateur,
        pto,
        optionSmartphone,
        autresOptions,
        rio,
        iban,
        provenanceFichier,
        free_agent_account,
        etat_cmd,
        ref_cmd,
        status,
        saleId,
      ]
    );

    // Définir les champs à vérifier pour le log
    const fieldsToCheck = [
      'civilite', 'nomClient', 'prenomClient', 'emailClient', 'numMobile', 'numFixe',
      'villeClient', 'adresseClient', 'codePostal', 'engagement', 'typeTechnologie',
      'prixOffre', 'ancienOperateur', 'pto', 'optionSmartphone', 'autresOptions',
      'rio', 'iban', 'provenanceFichier', 'free_agent_account', 'etat_cmd', 'ref_cmd', 'status'
    ];

    const keyMap = {
      nomClient: 'client_name',
      prenomClient: 'client_firstname',
      emailClient: 'client_email',
      numMobile: 'client_phone',
      numFixe: 'client_phone_fix',
      villeClient: 'ville_client',
      adresseClient: 'adresse_client',
      codePostal: 'code_postal_client',
      typeTechnologie: 'type_technologie',
      prixOffre: 'prix_offre',
      ancienOperateur: 'ancien_operateur',
      optionSmartphone: 'option_smartphone',
      autresOptions: 'autres_options',
      provenanceFichier: 'provenance_fichier',
    };

    // 3️⃣ Calculer les champs modifiés
    const modifiedFields = fieldsToCheck
      .map(f => {
        const dbKey = keyMap[f] || f;
        const newValue = f === 'prixOffre' ? finalPrixOffre : req.body[f];
        if (oldSale[dbKey] != newValue) {
          return `${f}: "${oldSale[dbKey]}" → "${newValue}"`;
        }
        return null;
      })
      .filter(Boolean);

    // 4️⃣ Log dans sales_history si des modifications
    if (modifiedFields.length) {
      await logSaleHistory({
        saleId,
        action: 'MODIFICATION',
        actorId: req.user.id,
        actorName: await getActorName(req),
        commentaire: modifiedFields.join(', '),
      });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Vente Mobile non trouvée" });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la vente mobile :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// Mettre à jour le statut d'une vente by Admin
exports.updateSaleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, motif } = req.body;
    const updatedBy = req.user.id;
    const actorName = await getActorName(req);

    const oldSaleRes = await db.query('SELECT * FROM sales WHERE id=$1', [id]);
    if (oldSaleRes.rows.length === 0) {
      return res.status(404).json({ message: 'Vente non trouvée' });
    }
    const oldSale = oldSaleRes.rows[0];

    // 🔹 Mapping des statuts
    const statusMap = {
      validated: 'Payée',
      cancelled: 'Annulée',
      pending: 'Defaut'
    };
    const mappedStatus = statusMap[status] || statusMap['pending'];

    // Pour le log : mapper l'ancien statut aussi
    const oldMappedStatus = Object.values(statusMap).includes(oldSale.status)
      ? oldSale.status
      : statusMap[oldSale.status] || oldSale.status;

    const newMappedStatus = mappedStatus;

    let query, values;
    if (status === 'cancelled') {
      query = `
        UPDATE sales
        SET status = $1,
            cancelled_reason = $2,
            updated_at = NOW(),
            updated_by = $3
        WHERE id = $4
        RETURNING *;
      `;
      values = [mappedStatus, motif, updatedBy, id];
    } else {
      // validated
      query = `
        UPDATE sales
        SET status = $1,
            updated_at = NOW(),
            updated_by = $2
        WHERE id = $3
        RETURNING *;
      `;
      values = [mappedStatus, updatedBy, id];
    }
    const result = await db.query(query, values);
    const newSale = result.rows[0]

    const modifiedFields = [];
    if (oldMappedStatus !== newMappedStatus) {
      modifiedFields.push(`Le statut est passé de : "${oldMappedStatus}" → "${newMappedStatus}"`);
      if (status === 'cancelled') {
        modifiedFields.push(`Raison de l'annulation : "${oldSale.cancelled_reason || ''}" → "${motif}"`);
      }
    }

    if (modifiedFields.length) {
      await logSaleHistory({
        saleId: id,
        action: 'MODIFICATION_STATUT',
        actorId: updatedBy,
        actorName,
        commentaire: modifiedFields.join(', ')
      });
    }

    res.json(newSale);
  } catch (error) {
    console.error('Erreur updateSaleStatus:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Mettre a jour le champ audite d'une vente.
exports.auditeSale = async (req, res) => {
  const { id } = req.params;
  const { audite } = req.body;
  const actorId = req.user.id;

  try {

    const oldSaleRes = await db.query('SELECT * FROM sales WHERE id=$1', [id]);
    if (oldSaleRes.rows.length === 0) {
      return res.status(404).json({ message: "Vente introuvable" });
    }
    const oldSale = oldSaleRes.rows[0];

    const { rows } = await db.query(
      `UPDATE sales 
       SET audite = $1, 
           date_audite = CASE 
                           WHEN $1 = true THEN NOW()
                           ELSE NULL
                         END
       WHERE id = $2 
       RETURNING *`,
      [audite, id]
    );

    const newSale = rows[0];

    // Log dans sales_history
    const modifiedFields = {};
    if (oldSale.audite !== newSale.audite) {
      modifiedFields['audite'] = [oldSale.audite, newSale.audite];
      modifiedFields['date_audite'] = [oldSale.date_audite, newSale.date_audite];
    }

    if (Object.keys(modifiedFields).length) {
      await logSaleHistory({
        saleId: id,
        action: 'AUDITION',
        actorId,
        actorName: await getActorName(req),
        changedColumns: modifiedFields,
        commentaire: `Vente ${audite ? 'auditée' : 'désauditée'}`
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Vente introuvable" });
    }

    res.json(newSale);
  } catch (err) {
    console.error("Erreur update audit:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}