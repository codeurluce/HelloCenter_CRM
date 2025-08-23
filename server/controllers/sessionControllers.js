// server/controllers/sessionControllers.js
const db = require('../db');
const dayjs = require("dayjs");

exports.createSession = async (req, res) => {
  try {
    console.log('📥 Requête reçue pour session :', req.body);
    const { user_id, status, pause_type, start_time, end_time } = req.body;
    if (status === 'pause' && !pause_type) {
      return res.status(400).json({ message: 'Le type de pause est requis pour une session de pause.' });
    }

    if (!user_id || !status || !start_time) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }

    // Calculer la durée en secondes si endTime existe
    let duration = null;
    if (end_time) {
      const start = new Date(start_time);
      const end = new Date(end_time);
      duration = Math.floor((end - start) / 1000);
      if (duration < 0) duration = null; // sécurité
    }

    await db.query(
      `INSERT INTO session_agents (user_id, status, pause_type, start_time, end_time, duration)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [user_id, status, pause_type || null, start_time, end_time || null, duration]
    );
    res.status(201).json({ message: 'Session enregistrée avec succès' });

  } catch (error) {
    console.error('Erreur enregistrement session :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Fermer la session active 
exports.closeCurrentSession = async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ message: "user_id est requis" });
    }
    // Met à jour la session active (end_time NULL) pour l'utilisateur
    const now = new Date();
    const result = await db.query(
      `UPDATE session_agents
       SET end_time = $1,
           duration = EXTRACT(EPOCH FROM ($1 - start_time))
       WHERE user_id = $2
         AND end_time IS NULL
       RETURNING id, status`,
      [now, user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Aucune session active trouvée" });
    }

    res.status(200).json({ 
  message: "Session fermée avec succès",
  session_id: result.rows[0].id,
  status: "En ligne mais inactif",
  is_connected: false
});
  } catch (error) {
    console.error('Erreur fermeture session :', error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.closeSessionForce = async (userId) => {
  try {
    const query = `
      UPDATE session_agents
      SET end_time = NOW(),
          duration = EXTRACT(EPOCH FROM (NOW() - start_time))
      WHERE user_id = $1 AND end_time IS NULL
      RETURNING *;
    `;
    const result = await db.query(query, [userId]);
    if (result.rows.length > 0) {
      console.log(`✅ Session fermée pour l'agent ${userId} (déconnexion forcée).`);
      return result.rows[0];
    } else {
      console.log(`ℹ️ Aucune session active trouvée pour l'agent ${userId}.`);
      return null;
    }
  } catch (error) {
    console.error("❌ Erreur closeSessionForce:", error);
    throw error;
  }
};

// GET /api/sessions/agents/live
exports.getLiveSessionAgents = async (req, res) => {
  try {
    const query = `
      WITH sessions_today AS (
        SELECT user_id, status, start_time, COALESCE(end_time, NOW()) AS end_time
        FROM session_agents
        WHERE DATE(start_time) = CURRENT_DATE
      ),
      cumuls AS (
        SELECT user_id, SUM(EXTRACT(EPOCH FROM (end_time - start_time)))::INT AS presence_totale_sec
        FROM sessions_today
        GROUP BY user_id
      ),
      actives AS (
        SELECT sa.user_id, sa.status, sa.start_time AS last_change,
               EXTRACT(EPOCH FROM (NOW() - sa.start_time))::INT AS depuis_sec
        FROM session_agents sa
        WHERE sa.end_time IS NULL
          AND DATE(sa.start_time) = CURRENT_DATE
      )
      SELECT 
        u.id AS user_id,
        u.lastname,
        u.firstname,
        CASE 
          WHEN u.is_connected = false THEN 'Hors ligne'
          ELSE COALESCE(a.status, 'En ligne mais inactif')
        END AS statut_actuel,
        COALESCE(a.depuis_sec, 0) AS depuis_sec,
        COALESCE(c.presence_totale_sec, 0) AS presence_totale_sec,
        u.is_connected
      FROM users u
      LEFT JOIN actives a ON u.id = a.user_id
      LEFT JOIN cumuls c ON u.id = c.user_id
      ORDER BY u.lastname, u.firstname;
    `;

    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur getLiveSessionAgents:", err);
    res.status(500).json({ error: "Erreur récupération sessions live" });
  }
};


exports.getUserStatusToday = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT sa.*
      FROM session_agents sa
      INNER JOIN (
        SELECT 
          user_id,
          DATE(start_time) AS jour,
          MAX(start_time) AS max_start_time
        FROM session_agents
        WHERE user_id = $1 AND DATE(start_time) = CURRENT_DATE
        GROUP BY user_id, DATE(start_time)
      ) last_session 
      ON sa.user_id = last_session.user_id 
      AND DATE(sa.start_time) = last_session.jour 
      AND sa.start_time = last_session.max_start_time;
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      // Retourner statut par défaut
      return res.json({ user_id: id, status: 'Inconnu' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erreur getUserStatusToday:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};



























exports.getSessions = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
            s.*,                        -- récupère toutes les colonnes de la table session_agents
            u.firstname,                -- ajoute le prénom de l'utilisateur
            u.lastname,                 -- ajoute le nom de famille de l'utilisateur
            u.email                     -- ajoute l'email de l'utilisateur
        FROM session_agents s           -- table principale : sessions des agents
        JOIN users u                    -- jointure avec la table des utilisateurs
        ON u.id = s.user_id             -- condition : la session appartient à un utilisateur
        ORDER BY s.start_time DESC      -- tri des résultats par date/heure de début, du plus récent au plus ancien
`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Erreur getSessions:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getUserDayTotal = async (req, res) => {
  try {
    const { userId } = req.params;
    const startOfDay = dayjs().startOf("day").toISOString();
    const endOfDay = dayjs().endOf("day").toISOString();

    const result = await db.query(
      `SELECT SUM(EXTRACT(EPOCH FROM (
          COALESCE(end_time, NOW()) - start_time
      ))) AS total_seconds
       FROM session_agents
       WHERE user_id = $1
         AND start_time >= $2
         AND start_time <= $3`,
      [userId, startOfDay, endOfDay]
    );

    res.json({
      user_id: userId,
      total: result.rows[0].total_seconds ? parseInt(result.rows[0].total_seconds, 10) : 0
    });
  } catch (error) {
    console.error("Erreur getUserDayTotal:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getActiveSession = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await db.query(
      `SELECT * FROM session_agents
       WHERE user_id = $1 AND end_time IS NULL
       ORDER BY start_time DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        user_id: id,
        status: 'Inconnu',
        start_time: null,
        end_time: null
      });
    }
    res.json({
      user_id: result.rows[0].user_id,
      status: result.rows[0].status,
      start_time: result.rows[0].start_time,
      end_time: result.rows[0].end_time
    });

  } catch (error) {
    console.error("Erreur getActiveSession:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 📌 Récupérer l’historique des sessions d’un agent
// GET /api/sessions/history/:user_id
exports.getUserStatusToday = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT sa.*
      FROM session_agents sa
      INNER JOIN (
        SELECT 
          user_id,
          DATE(start_time) AS jour,
          MAX(start_time) AS max_start_time
        FROM session_agents
        WHERE user_id = $1 AND DATE(start_time) = CURRENT_DATE
        GROUP BY user_id, DATE(start_time)
      ) last_session 
      ON sa.user_id = last_session.user_id 
      AND DATE(sa.start_time) = last_session.jour 
      AND sa.start_time = last_session.max_start_time;
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      // Retourner statut par défaut
      return res.json({ user_id: id, status: 'Inconnu' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erreur getUserStatusToday:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 📌 Changer de statut (Disponible → Pause → Indispo etc.)
// POST /api/sessions/change
exports.changeStatus = async (req, res) => {
  const { user_id, new_status, pause_type } = req.body;

  try {
    // 1. Fermer la session active si elle existe
    const { rows: activeRows } = await db.query(
      `SELECT * FROM session_agents WHERE user_id = $1 AND end_time IS NULL ORDER BY start_time DESC LIMIT 1`,
      [user_id]
    );

    if (activeRows.length > 0) {
      await db.query(
        `UPDATE session_agents SET end_time = NOW() WHERE id = $1`,
        [activeRows[0].id]
      );
    }

    // 2. Créer une nouvelle session avec le nouveau statut
    const { rows: newSession } = await db.query(
      `INSERT INTO session_agents (user_id, status, pause_type, start_time) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING *`,
      [user_id, new_status, pause_type || null]
    );

    res.json(newSession[0]);
  } catch (error) {
    console.error("❌ Erreur changeStatus:", error);
    res.status(500).json({ error: "Erreur serveur lors du changement de statut." });
  }
};

exports.getUserHistory = async (req, res) => {
  const { id } = req.params;
  const { period } = req.query; // ex: ?period=today | week | month | all

  let query = `SELECT * FROM session_agents WHERE user_id = $1`;
  const params = [id];

  if (period === 'today') {
    query += ` AND DATE(start_time) = CURRENT_DATE`;
  } else if (period === 'week') {
    query += ` AND start_time >= date_trunc('week', CURRENT_DATE)`;
  } else if (period === 'month') {
    query += ` AND start_time >= date_trunc('month', CURRENT_DATE)`;
  }

  query += ` ORDER BY start_time DESC`;

  try {
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Erreur getUserHistory:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getUserTodayAggregates = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Cumul des temps par statut
    const q = `
      SELECT status AS status,
             SUM(EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time)))::bigint AS seconds
      FROM session_agents
      WHERE user_id = $1
        AND DATE(start_time) = CURRENT_DATE
      GROUP BY status
    `;
    const { rows } = await db.query(q, [id]);

    const totals = {};
    for (const r of rows) totals[r.status] = Number(r.seconds) || 0;

    const presence_total = Object.values(totals).reduce((a, b) => a + b, 0);

    // 2. Statut en cours (dernière session sans end_time)

    const q2 = `
      SELECT status AS status, start_time
      FROM session_agents
      WHERE user_id = $1 
        AND DATE(start_time) = CURRENT_DATE
        AND end_time IS NULL
      ORDER BY start_time DESC
      LIMIT 1
    `; 
    const { rows: activeRows } = await db.query(q2, [id]);
    const active = activeRows[0] || null;

    return res.json({
      totals,          // ex: { "Disponible": 1080, "Pause Café": 300 }
      presence_total,  // somme
      active,          // ex: { status: "Disponible", start_time: "2025-08-21T12:05:00Z" }
      server_time: new Date().toISOString(),
    });
  } catch (e) {
    console.error("getUserTodayAggregates error:", e);
    res.status(500).json({ message: "Erreur serveur", error: e.message });
  }
};
