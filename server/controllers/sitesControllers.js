// controllers/sitesController.js
const db = require("../db");

exports.getAllSites = async (req, res) => {
  try {
    if (req.user.role !== "SuperAdmin" && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const result = await db.query(`
      SELECT *
      FROM sites
      ORDER BY name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération sites:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// --- Ajouter un site ---
exports.createSites = async (req, res) => {
  const { code, name } = req.body;

  if (!code || !name) {
    return res.status(400).json({ error: "Code et nom sont requis" });
  }

  try {
    const result = await db.query(
      "INSERT INTO sites (code, name) VALUES ($1, $2) RETURNING *",
      [code, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erreur ajout site:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// --- Modifier un site ---
exports.updateSites = async (req, res) => {
  const { id } = req.params;
  const { code, name } = req.body;

  if (!code || !name) {
    return res.status(400).json({ error: "Code et nom sont requis" });
  }

  try {
    const result = await db.query(
      "UPDATE sites SET code = $1, name = $2 WHERE id = $3 RETURNING *",
      [code, name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Site non trouvé" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erreur modification site:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// --- Supprimer un site ---
exports.deleteSites = async (req, res) => {
  const { id } = req.params;

  try {
    // Vérifier s’il existe des dépendances (optionnel, ex: agents liés à ce site)
    const result = await db.query("DELETE FROM sites WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Site non trouvé" });
    }

    res.json({ message: "Site supprimé avec succès" });
  } catch (err) {
    console.error("Erreur suppression site:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};