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

// ✅ Ventes hebdomadaires de l’agent connecté
exports.getWeeklySales = async (req, res) => {
    try {
        const agentId = req.user.id;

        const query = `
      SELECT 
  TO_CHAR(created_at, 'Dy') AS day, -- ex: 'Mon', 'Tue', 'Wed'
  DATE(created_at) AS date,
  COUNT(*) AS validated_sales
FROM sales
WHERE agent_id = $1
  AND status = 'pending'  -- uniquement les ventes de l'agent(pendind/accord/vendu)
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
