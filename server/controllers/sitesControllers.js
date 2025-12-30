// controllers/sitesController.js
const db = require("../db");

exports.getAllSites = async (req, res) => {
  try {
    if (req.user.role !== "SuperAdmin") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const result = await db.query(`
      SELECT id, code, name
      FROM sites
      ORDER BY name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération sites:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
