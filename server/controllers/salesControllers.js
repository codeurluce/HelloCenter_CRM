// controllers/salesController.js pour les ventes du jour
const db = require('../db'); // selon ton setup

exports.getTodaySummary = async (req, res) => {
  try {
    // const today = new Date().toISOString().split('T')[0]; 
    const agentId = req.user.id; // récupéré depuis le middleware d’authentification

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

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};


// controllers/salesController.js pour les ventes hebdomadaires
const pool = require('../db');

const getWeeklySales = async (req, res) => {
  try {
    const agentId = req.user.id; // récupéré via middleware auth

    const query = `
      SELECT 
        TO_CHAR(DATE(created_at), 'Dy') AS day,  -- Mon, Tue, etc.
        COUNT(*) AS total_sales
      FROM sales
      WHERE agent_id = $1
        AND created_at >= date_trunc('week', CURRENT_DATE)  -- début semaine lundi
        AND created_at < date_trunc('week', CURRENT_DATE) + interval '7 days'
      GROUP BY day
      ORDER BY date_trunc('day', created_at);
    `;

    const { rows } = await pool.query(query, [agentId]);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getWeeklySales };