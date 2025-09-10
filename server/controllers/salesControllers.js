const db = require('../db');

// Notez bien que:
//   pending: 'signifie les ventes de l'agent',
//   validated: 'signifie les ventes qui sont payes à l'agent',
//   cancelled: 'signifie les ventes qui sont annules',



// ✅ Résumé des ventes du jour pour l'agent connecté
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

// ✅ Résumé des Ventes hebdomadaires de l’agent connecté
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
    {
      // Simule une sauvegarde de vente
      console.log('Requête reçue:', req.body);
    }
    const agentId = req.user.id;

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
    const result = await db.query(
      'DELETE FROM sales WHERE id = $1 RETURNING *',
      [saleId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Vente non trouvée' });
    }

    res.json({ message: 'Vente supprimée avec succès', sale: result.rows[0] });
  } catch (error) {
    console.error('Erreur deleteSale:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};


// Export pour mettre à jour une vente
exports.updateSale = async (req, res) => {
  try {
    const saleId = req.params.id;

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
         civilite = $1,
         client_name = $2,
         client_firstname = $3,
         client_email = $4,
         client_phone = $5,
         client_phone_fix = $6,
         ville_client = $7,
         adresse_client = $8,
         code_postal_client = $9,
         ref_client = $10,
         ref_contrat = $11,
         energie = $12,
         pdl = $13,
         pce = $14,
         nature_offre = $15,
         puissance_compteur = $16,
         partenaire = $17,
         etat_contrat = $18,
         status = $19,
         fichier = $20,
         updated_at = NOW()
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

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Vente non trouvée" });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la vente :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


// Mettre à jour le statut d'une vente by Admin
exports.updateSaleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, motif } = req.body;
    const updatedBy = req.user.id;

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
      values = [status, motif, updatedBy, id];
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
      values = [status, updatedBy, id];
    }

    const result = await db.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur updateSaleStatus:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
