// server/controllers/sessionControllers.js
const db = require('../db');
const dayjs = require("dayjs");

// Activer la session active 
exports.createSession = async (req, res) => {
  try {
    console.log('📥 Requête reçue pour session :', req.body);
    const { user_id, status, start_time, end_time } = req.body;
    console.log("🆕 CRÉATION SESSION - userId:", user_id, "status:", status); // ← LOG ICI

    if (status === 'pause') {
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
      `INSERT INTO session_agents (user_id, status, start_time, end_time, duration)
       VALUES ($1, $2, $3, $4, $5,)
       RETURNING id`,
      [user_id, status, start_time, end_time || null, duration]
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
    console.log("CloseOperation: Fermeture FORCE pour", user_id);

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "❌ user_id est requis",
      });
    }

    const now = new Date();

    // Mettre fin à la session active de l’utilisateur
    const result = await db.query(
      `
      UPDATE session_agents
      SET end_time = $1,
          duration = EXTRACT(EPOCH FROM ($1 - start_time))
      WHERE user_id = $2
        AND end_time IS NULL
      RETURNING id, status, start_time, end_time, duration
      `,
      [now, user_id]
    );

    if (result.rowCount === 0) {
      // Aucun enregistrement mis à jour → pas de session active
      console.warn(`⚠️ Aucun session active trouvée pour user_id=${user_id}`);
      return res.status(200).json({
        success: true,
        message: "ℹ️ Aucune session active à fermer",
        is_connected: false,
        session: null,
      });
    }

    // Session fermée avec succès
    const session = result.rows[0];
    res.status(200).json({
      success: true,
      message: "✅ Session fermée avec succès",
      is_connected: false,
      session: {
        id: session.id,
        status: session.status,
        start_time: session.start_time,
        end_time: session.end_time,
        duration: session.duration,
      },
    });

  } catch (error) {
    console.error("❌ Erreur fermeture session :", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la fermeture de session",
    });
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
        SELECT user_id, status, SUM(EXTRACT(EPOCH FROM (end_time - start_time)))::INT AS sec
        FROM sessions_today
        GROUP BY user_id, status
      ),
      cumul_total AS (
        SELECT user_id, SUM(sec)::INT AS presence_totale_sec
        FROM cumuls
        GROUP BY user_id
      ),
      last_status AS (
        SELECT DISTINCT ON (user_id)
               user_id,
               status AS statut_actuel,
               EXTRACT(EPOCH FROM (NOW() - start_time))::INT AS depuis_sec
        FROM session_agents
        WHERE end_time IS NULL AND DATE(start_time) = CURRENT_DATE
        ORDER BY user_id, start_time DESC
      ),
      cumul_json AS (
        SELECT c.user_id,
               json_object_agg(c.status, c.sec) AS cumul_statuts
        FROM cumuls c
        GROUP BY c.user_id
      )
      SELECT 
        u.id AS user_id,
        u.lastname,
        u.firstname,
        COALESCE(ls.statut_actuel, 
                 CASE WHEN u.is_connected = false THEN 'Hors ligne' ELSE 'En ligne' END
        ) AS statut_actuel,
        COALESCE(ls.depuis_sec, 0) AS depuis_sec,
        COALESCE(ct.presence_totale_sec, 0) AS presence_totale_sec,
        u.is_connected,
        COALESCE(cj.cumul_statuts, '{}'::json) AS cumul_statuts
      FROM users u
      LEFT JOIN last_status ls ON u.id = ls.user_id
      LEFT JOIN cumul_total ct ON u.id = ct.user_id
      LEFT JOIN cumul_json cj ON u.id = cj.user_id
      ORDER BY u.lastname, u.firstname;
    `;

    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur getLiveSessionAgents:", err);
    res.status(500).json({ error: "Erreur récupération sessions live" });
  }
};

// GET /api/sessions/agents/live/:userId
// exports.getSessionAgent = async (req, res) => {
//   const { userId } = req.params;

//   if (!userId) {
//     return res.status(400).json({ error: "userId manquant" });
//   }

//   try {
//     const query = `
//       WITH sessions_today AS (
//         SELECT user_id, status, start_time, COALESCE(end_time, NOW()) AS end_time
//         FROM session_agents
//         WHERE DATE(start_time) = CURRENT_DATE
//           AND user_id = $1
//       ),
//       cumuls AS (
//         SELECT user_id, status, SUM(EXTRACT(EPOCH FROM (end_time - start_time)))::INT AS sec
//         FROM sessions_today
//         GROUP BY user_id, status
//       ),
//       cumul_total AS (
//         SELECT user_id, SUM(sec)::INT AS presence_totale_sec
//         FROM cumuls
//         GROUP BY user_id
//       ),
//       last_status AS (
//         SELECT DISTINCT ON (user_id)
//                user_id,
//                status AS statut_actuel,
//                EXTRACT(EPOCH FROM (NOW() - start_time))::INT AS depuis_sec
//         FROM session_agents
//         WHERE end_time IS NULL
//           AND DATE(start_time) = CURRENT_DATE
//           AND user_id = $1
//         ORDER BY user_id, start_time DESC
//       ),
//       cumul_json AS (
//         SELECT c.user_id,
//                json_object_agg(c.status, c.sec) AS cumul_statuts
//         FROM cumuls c
//         GROUP BY c.user_id
//       )
//       SELECT 
//         u.id AS user_id,
//         u.lastname,
//         u.firstname,
//         COALESCE(ls.statut_actuel, 
//                  CASE WHEN u.is_connected = false THEN 'Hors ligne' ELSE 'En ligne' END
//         ) AS statut_actuel,
//         COALESCE(ls.depuis_sec, 0) AS depuis_sec,
//         COALESCE(ct.presence_totale_sec, 0) AS presence_totale_sec,
//         u.is_connected,
//         COALESCE(cj.cumul_statuts, '{}'::json) AS cumul_statuts
//       FROM users u
//       LEFT JOIN last_status ls ON u.id = ls.user_id
//       LEFT JOIN cumul_total ct ON u.id = ct.user_id
//       LEFT JOIN cumul_json cj ON u.id = cj.user_id
//       WHERE u.id = $1
//       ORDER BY u.lastname, u.firstname;
//     `;

//     const result = await db.query(query, [userId]);
//     res.json(result.rows[0] || null); // renvoie l'agent unique
//   } catch (err) {
//     console.error("Erreur getLiveSessionAgent:", err);
//     res.status(500).json({ error: "Erreur récupération session live" });
//   }
// };

// GET /api/session_agents/user/live/:userId
exports.getSessionAgent = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "userId manquant" });
  }

  try {
    const query = `
      WITH sessions_today AS (
        SELECT user_id, status, start_time, COALESCE(end_time, NOW()) AS end_time
        FROM session_agents
        WHERE DATE(start_time) = CURRENT_DATE
          AND user_id = $1
      ),
      -- ✅ Exclure les sessions actives (end_time IS NULL) du cumul
      cumuls AS (
        SELECT user_id, status, SUM(EXTRACT(EPOCH FROM (end_time - start_time)))::INT AS sec
        FROM session_agents
        WHERE DATE(start_time) = CURRENT_DATE
          AND user_id = $1
          AND end_time IS NOT NULL  -- ← SEULE MODIFICATION
        GROUP BY user_id, status
      ),
      cumul_total AS (
        SELECT user_id, SUM(sec)::INT AS presence_totale_sec
        FROM cumuls
        GROUP BY user_id
      ),
      last_session AS (
        SELECT user_id, status, start_time
        FROM session_agents
        WHERE end_time IS NULL
          AND DATE(start_time) = CURRENT_DATE
          AND user_id = $1
        ORDER BY start_time DESC
        LIMIT 1
      ),
      cumul_json AS (
        SELECT c.user_id,
               json_object_agg(c.status, c.sec) AS cumul_statuts
        FROM cumuls c
        GROUP BY c.user_id
      )
      SELECT 
        u.id AS user_id,
        u.lastname,
        u.firstname,
        COALESCE(ls.status, 
                 CASE WHEN u.is_connected = false THEN 'Hors ligne' ELSE 'En ligne' END
        ) AS statut_actuel,
        ls.start_time AS session_start_time,
        COALESCE(ct.presence_totale_sec, 0) AS presence_totale_sec,
        u.is_connected,
        COALESCE(cj.cumul_statuts, '{}'::json) AS cumul_statuts
      FROM users u
      LEFT JOIN last_session ls ON u.id = ls.user_id
      LEFT JOIN cumul_total ct ON u.id = ct.user_id
      LEFT JOIN cumul_json cj ON u.id = cj.user_id
      WHERE u.id = $1;
    `;

    const result = await db.query(query, [userId]);
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error("Erreur getLiveSessionAgent:", err);
    res.status(500).json({ error: "Erreur récupération session live" });
  }
};

exports.getDailyConnectionTimes = async (req, res) => {
  try {
    const query = `
      SELECT 
        user_id,
        MIN(event_time) FILTER (WHERE event_type = 'connect') AS first_connection,
        MAX(event_time) FILTER (WHERE event_type = 'disconnect') AS last_disconnection
      FROM agent_connections_history
      WHERE DATE(event_time) = CURRENT_DATE
      GROUP BY user_id
      ORDER BY user_id;
    `;

    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur getDailyConnectionTimes:", err);
    res.status(500).json({ error: "Erreur récupération connexions quotidiennes" });
  }
};

// POST /export-sessions
exports.exportSessions = async (req, res) => {
  try {
    const { userIds = [], startDate, endDate } = req.body || {};

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate et endDate sont obligatoires" });
    }

    // Préparer la clause pour filtrer les users si nécessaire
    const userFilter = userIds && userIds.length ? `AND sa.user_id = ANY($3)` : '';

    const query = `
      WITH sessions AS (
        SELECT 
          sa.user_id,
          sa.status,
          DATE(sa.start_time) AS session_date,
          sa.start_time,
          COALESCE(sa.end_time, NOW()) AS end_time,
          EXTRACT(EPOCH FROM (COALESCE(sa.end_time, NOW()) - sa.start_time))::INT AS duree_sec
        FROM session_agents sa
        WHERE DATE(sa.start_time) BETWEEN $1 AND $2
        ${userFilter}
      ),
      cumuls AS (
        SELECT user_id, session_date, status, SUM(duree_sec)::INT AS sec
        FROM sessions
        GROUP BY user_id, session_date, status
      ),
      cumul_total AS (
        SELECT user_id, session_date, SUM(sec)::INT AS presence_totale_sec
        FROM cumuls
        GROUP BY user_id, session_date
      ),
      last_status AS (
        SELECT DISTINCT ON (user_id, DATE(start_time)) 
               user_id,
               DATE(start_time) AS session_date,
               status AS statut_actuel,
               EXTRACT(EPOCH FROM (NOW() - start_time))::INT AS depuis_sec
        FROM session_agents
        WHERE end_time IS NULL
          AND DATE(start_time) BETWEEN $1 AND $2
        ORDER BY user_id, DATE(start_time), start_time DESC
      ),
      cumul_json AS (
        SELECT user_id, session_date,
               json_object_agg(status, sec) AS cumul_statuts
        FROM cumuls
        GROUP BY user_id, session_date
      ),
      connections AS (
        SELECT 
          ach.user_id,
          DATE(ach.event_time) AS session_date,
          MIN(ach.event_time) FILTER (WHERE event_type = 'connect') AS first_connection,
          MAX(ach.event_time) FILTER (WHERE event_type = 'disconnect') AS last_disconnection
        FROM agent_connections_history ach
        WHERE DATE(ach.event_time) BETWEEN $1 AND $2
        GROUP BY ach.user_id, DATE(ach.event_time)
      )
      SELECT 
  u.id AS user_id,
  u.lastname,
  u.firstname,
  COALESCE(ls.statut_actuel, 
           CASE WHEN u.is_connected = false THEN 'Hors ligne' ELSE 'En ligne' END
  ) AS statut_actuel,
  COALESCE(ls.depuis_sec, 0) AS depuis_sec,
  COALESCE(ct.presence_totale_sec, 0) AS presence_totale_sec,
  COALESCE(cj.cumul_statuts, '{}'::json) AS cumul_statuts,
  co.first_connection,
  co.last_disconnection,
  ct.session_date
FROM users u
LEFT JOIN cumul_total ct ON ct.user_id = u.id
LEFT JOIN cumul_json cj ON cj.user_id = u.id AND cj.session_date = ct.session_date
LEFT JOIN last_status ls ON ls.user_id = u.id AND ls.session_date = ct.session_date
LEFT JOIN connections co ON co.user_id = u.id AND co.session_date = ct.session_date
WHERE ct.session_date BETWEEN $1 AND $2
${userFilter ? "AND u.id = ANY($3)" : ""}
ORDER BY u.lastname, u.firstname, ct.session_date;
    `;

    const params = [startDate, endDate];
    if (userIds && userIds.length) params.push(userIds);

    const { rows } = await db.query(query, params);

    res.json(rows);

  } catch (err) {
    console.error("Erreur exportSessions:", err);
    res.status(500).json({ error: "Erreur export sessions" });
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

exports.splitSessionsAtMidnight = async () => {
  try {
    // sessions actives hier à 23:59:59
    const activeSessions = await db.query(`
      SELECT * FROM session_agents
      WHERE end_time IS NULL
    `);

    for (const session of activeSessions.rows) {
      const { user_id, start_time } = session;

      // si start_time < aujourd'hui 00:00 → on doit couper
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start_time < today) {
        // 1. Clôturer l'ancienne session à 23:59:59 hier
        await db.query(`
          UPDATE session_agents
          SET end_time = (DATE_TRUNC('day', NOW()) - INTERVAL '1 second'),
              duration = EXTRACT(EPOCH FROM ((DATE_TRUNC('day', NOW()) - INTERVAL '1 second') - start_time))
          WHERE user_id = $1 AND end_time IS NULL
        `, [user_id]);

        // 2. Créer une nouvelle session à 00:00:00 aujourd'hui
        await db.query(`
          INSERT INTO session_agents (user_id, start_time)
          VALUES ($1, DATE_TRUNC('day', NOW()))
        `, [user_id]);

        console.log(`🔄 Session de l'agent ${user_id} splittée à minuit`);
      }
    }
  } catch (err) {
    console.error("❌ Erreur splitSessionsAtMidnight:", err);
  }
};

// ----------------------------- NOUVELLE GESTION DU TIMER VIA BACKEND -------------------

exports.startSession = async (req, res) => {
  const { user_id, status = 'Disponible' } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id requis' });

  try {
    // Si session active existante -> retourne son id (idempotence)
    const active = await db.query(
      `SELECT id FROM session_agents WHERE user_id = $1 AND end_time IS NULL LIMIT 1`,
      [user_id]
    );
    if (active.rowCount > 0) {
      return res.json({ success: true, session_id: active.rows[0].id, reused: true });
    }

    const result = await db.query(
      `INSERT INTO session_agents (user_id, status, start_time, last_ping)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING id, start_time`,
      [user_id, status]
    );

    res.json({ success: true, session_id: result.rows[0].id, start_time: result.rows[0].start_time });
  } catch (err) {
    console.error('startSession error', err);
    res.status(500).json({ error: 'server error' });
  }
};

exports.stopSession = async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id requis' });

  try {
    const now = new Date();
    const result = await db.query(
      `UPDATE session_agents
       SET end_time = $1,
           duration = EXTRACT(EPOCH FROM ($1 - start_time))::INT
       WHERE user_id = $2 AND end_time IS NULL
       RETURNING *`,
      [now, user_id]
    );

    if (result.rowCount === 0) {
      return res.json({ success: true, message: 'no active session to stop' });
    }

    res.json({ success: true, session: result.rows[0] });
  } catch (err) {
    console.error('stopSession error', err);
    res.status(500).json({ error: 'server error' });
  }
};

exports.pingSession = async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id requis' });

  try {
    const result = await db.query(
      `UPDATE session_agents SET last_ping = NOW() 
       WHERE user_id = $1 AND end_time IS NULL
       RETURNING id, start_time`,
      [user_id]
    );
    if (result.rowCount === 0) {
      return res.json({ success: false, message: 'no active session' });
    }
    res.json({ success: true, session_id: result.rows[0].id });
  } catch (err) {
    console.error('pingSession error', err);
    res.status(500).json({ error: 'server error' });
  }
};

exports.closeSessionForce = async (userId) => {
  try {
    console.log(`[SERVER] closeSessionForce called for user ${userId}`);

    // Vérifier s’il existe une session active
    const check = await db.query(
      `SELECT id FROM session_agents
       WHERE user_id = $1 AND end_time IS NULL
       ORDER BY start_time DESC LIMIT 1`,
      [userId]
    );

    if (check.rowCount === 0) {
      console.log(`[SERVER] closeSessionForce: aucun statut actif pour ${userId}, rien à fermer`);
      return null; // ⛔ On ignore
    }

    // Clôturer la session active
    const result = await db.query(
      `UPDATE session_agents
       SET end_time = NOW(),
           duration = EXTRACT(EPOCH FROM (NOW() - start_time))::INT
       WHERE id = $1
       RETURNING id, start_time, end_time, duration`,
      [check.rows[0].id]
    );

    // Marquer l’agent comme déconnecté
    await db.query("UPDATE users SET is_connected = FALSE WHERE id = $1", [userId]);

    //  Ajouter un événement dans l’historique des connexions
    await db.query("INSERT INTO agent_connections_history (user_id, event_type) VALUES ($1, 'disconnect')", [userId]);

    const session = result.rows[0];
    console.log(`[SERVER] closeSessionForce: session closed for ${userId}`, session);
    return session;

  } catch (err) {
    console.error('[SERVER] closeSessionForce error', err);
    throw err;
  }
};

exports.heartbeat = async (req, res) => {
  const user_id  = req.user?.id; // car tu utilises authenticateToken

    if (!user_id) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  try {
    await db.query(
      `UPDATE session_agents 
       SET last_ping = NOW() 
       WHERE user_id = $1 AND end_time IS NULL`,
      [user_id]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("Heartbeat error", err);
    return res.status(500).json({ error: "server error" });
  }
};

/**
 * Récupère le dernier statut actif d’un agent
 * @param {number|string} userId 
 * @returns {Promise<string|null>} statut ou null si rien trouvé
 */

exports.getLastAgentStatus = async (userId) => {
  try {
    const result = await db.query(
      `SELECT status
       FROM session_agents
       WHERE user_id = $1
       ORDER BY start_time DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length > 0) {
      return result.rows[0].status;
    } else {
      return null; // aucun enregistrement trouvé
    }
  } catch (err) {
    console.error("❌ Erreur getLastAgentStatus:", err);
    return null;
  }
}

exports.checkSessionActive = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: 'userId manquant' });

    // Vérifie si une session active existe pour cet agent
    const result = await db.query(
      `SELECT * FROM session_agents 
       WHERE user_id = $1 AND end_time IS NULL`,
      [userId]
    );

    const active = result.rows.length > 0;
    res.json({ active });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
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
// 📌 Changer de statut (Disponible → Pause → Indispo etc.)
// POST /api/sessions/change
exports.changeStatus = async (req, res) => {
  const { user_id, new_status } = req.body;

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
      `INSERT INTO session_agents (user_id, status, start_time) 
       VALUES ($1, $2, NOW()) 
       RETURNING *`,
      [user_id, new_status]
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
