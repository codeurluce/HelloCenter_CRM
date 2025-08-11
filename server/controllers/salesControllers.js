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



const multer = require('multer');
const path = require('path');
// Configuration upload fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/');},// Dossier de destination  
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname)); // Nom du fichier
  }
});
const upload = multer({ storage });


// Export pour enregistrer une vente
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
} = req.body;
    const fichier = req.file ? req.file.filename : null;


    const result = await db.query(
      `
      INSERT INTO sales (
        agent_id, status, partenaire, civilite, client_name, client_firstname, client_email,
        client_phone, client_phone_fix, ville_client, adresse_client, code_postal_client, ref_client, ref_contrat,
        energie, pdl, pce, nature_offre, puissance_compteur, etat_contrat, fichier, product_type
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING *;
    `,
      [ agentId, status, partenaire, civilite, client_name, client_firstname, client_email,
      client_phone, client_phone_fix || null, ville_client, adresse_client, code_postal_client, ref_client, ref_contrat || null,
      energie, pdl || null, pce || null, nature_offre, puissance_compteur, etat_contrat, fichier, product_type
    ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur createSale:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};