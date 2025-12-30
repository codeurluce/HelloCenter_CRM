// server/controllers/sessionControllers.js
const db = require('../db');
const dayjs = require("dayjs");
const { getIo } = require("../socketInstance");
const { cronCleanShift } = require('../cronFichiers/cronCleanShift');


// ----------------------------- NOUVELLE GESTION DU TIMER VIA BACKEND -------------------

exports.startSession = async (req, res) => {
  const { user_id, status = 'Disponible' } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id requis' });

  try {
    const now = new Date();

    // ⚡ Démarrer une transaction pour éviter les doublons en cas de requêtes concurrentes
    await db.query('BEGIN');

    // 1️⃣ Fermer toute session active existante pour cet utilisateur
    await db.query(
      `UPDATE session_agents
       SET end_time = $1
       WHERE user_id = $2 AND end_time IS NULL`,
      [now, user_id]
    );

    // 2️⃣ Créer la nouvelle session
    const result = await db.query(
      `INSERT INTO session_agents (user_id, status, start_time, last_ping)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING id, start_time`,
      [user_id, status]
    );

    // Commit de la transaction
    await db.query('COMMIT');

    // 3️⃣ Notifier l'admin via Socket.IO
    const io = getIo();
    io.to("admins").emit("agent_status_changed", {
      userId: user_id,
      newStatus: status
    });

    res.json({
      success: true,
      session_id: result.rows[0].id,
      start_time: result.rows[0].start_time
    });
  } catch (err) {
    // Rollback en cas d'erreur
    await db.query('ROLLBACK');
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
       SET end_time = $1
       WHERE user_id = $2 AND end_time IS NULL
       RETURNING *`,
      [now, user_id]
    );

    if (result.rowCount === 0) {
      return res.json({ success: true, message: 'no active session to stop' });
    }

    // ⚡ Émettre l'événement Socket.IO pour que l'admin voie le statut "Hors Ligne"
    const io = getIo();
    io.to("admins").emit("agent_status_changed", {
      userId: user_id,
      newStatus: "Hors Ligne"
    });

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

// controllers/sessionControllers.js (ou autre fichier)
exports.closeSessionForce = async (userId, userSockets, adminId) => {
  try {
    const io = getIo();

    // 🔥 Plus de UPDATE ici → déjà fait par handleAgentDisconnect

    // Émettre événements
    io.to("admins").emit("agent_status_changed", { userId, newStatus: "Hors ligne" });
    io.to(`agent_${userId}`).emit("force_disconnect_by_admin", {
      reason: "Déconnecté par l’administrateur"
    });

    // Déconnecter les sockets
    const sockets = userSockets.get(userId);
    if (sockets) {
      sockets.forEach(socketId => {
        const s = io.sockets.sockets.get(socketId);
        if (s) s.disconnect(true);
      });
      userSockets.delete(userId);
    }

    return { socketsClosed: sockets?.size || 0 };
  } catch (err) {
    console.error('[SERVER] closeSessionForce error', err);
    throw err;
  }
};


exports.heartbeat = async (req, res) => {
  const user_id = req.user?.id; // car tu utilises authenticateToken

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

// POST /agent/:id/forcePause - Mettre un agent en pause déjeuner forcée par l'admin
exports.forcePauseByAdmin = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const requester = req.user; // contient { id, role }
    console.log(`[BACK] 🔄 forcePauseByAdmin appelé par ${requester.role} ${requester.id} sur user ${userId}`);

    if (!userId) {
      return res.status(400).json({ error: "userId manquant." });
    }

    if (!["Admin", "Manager"].includes(requester.role)) {
      return res.status(403).json({
        error: "Vous n'avez pas la permission de mettre un agent en pause.",
      });
    }

    // Récupérer l'utilisateur cible
    const { rows: userRows } = await db.query(
      `SELECT firstname, lastname, is_connected, session_closed, role
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: "Agent introuvable." });
    }

    const target = userRows[0];

    // Vérifier la hiérarchie des rôles
    if (requester.role === "Manager" && ["Admin", "SuperAdmin"].includes(target.role)) {
      return res.status(403).json({
        error: "Un manager ne peut pas forcer la pause d'un Admin.",
      });
    }

    if (!target.is_connected || target.session_closed) {
      return res.status(400).json({
        error: "Impossible de forcer la pause : l'agent n'est pas connecté ou sa session est fermée.",
      });
    }

    // Vérifier session active
    const { rows: sessionRows } = await db.query(
      `SELECT id, status, start_time
       FROM session_agents
       WHERE user_id = $1
         AND end_time IS NULL
       ORDER BY start_time DESC
       LIMIT 1`,
      [userId]
    );

    if (sessionRows.length === 0) {
      return res.status(400).json({ error: "Aucune session active trouvée pour cet agent." });
    }

    const currentSession = sessionRows[0];

    if (currentSession.status !== "Disponible") {
      return res.status(400).json({
        error: `Pause non forcée : l'agent est actuellement en "${currentSession.status}".`,
      });
    }

    const now = new Date();

    // Fermer la session actuelle
    await db.query(
      `UPDATE session_agents
       SET end_time = $1
       WHERE id = $2`,
      [now, currentSession.id]
    );

    const adminName = `${requester.firstname || ""} ${requester.lastname || ""}`.trim() || "Administrateur";

    // Créer une nouvelle session "Déjeuner" forcée
    await db.query(
      `INSERT INTO session_agents (user_id, status, start_time, pause_type)
       VALUES ($1, $2, $3, $4)`,
      [userId, "Déjeuner", now, `Action forcée par ${adminName}`]
    );

    // Émettre événements Socket.IO
    const io = getIo();
    io.to("admins").emit("agent_status_changed", { userId, newStatus: "Déjeuner" });
    io.to(`agent_${userId}`).emit("force_pause_by_admin", {
      reason: "Pause forcée par l’administrateur",
      pause_type: "Déjeuner",
      forced: true,
    });

    res.json({ success: true, message: "L'agent est maintenant en pause déjeuner (forcée)." });
  } catch (err) {
    console.error(`[BACK] ❌ Erreur forcePauseByAdmin:`, err);
    res.status(500).json({
      error: "Erreur serveur lors de la mise en pause de l'agent.",
    });
  }
};


// GET /api/sessions/agents/live
exports.getLiveSessionAgents = async (req, res) => {
  try {
    const query = `
      WITH sessions_today AS (
        SELECT user_id, status, start_time,
               COALESCE(end_time, NOW()) AS end_time
        FROM session_agents
        WHERE DATE(start_time) = CURRENT_DATE
      ),
      cumuls AS (
        SELECT user_id, status,
               SUM(EXTRACT(EPOCH FROM (end_time - start_time))::INT) AS sec
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
      WHERE u.is_active = true
      ORDER BY u.lastname, u.firstname;
    `;

    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur getLiveSessionAgents:", err);
    res.status(500).json({ error: "Erreur récupération sessions live" });
  }
};

// GET /api/session_agents/user/live/:userId
exports.getSessionAgent = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "userId manquant" });
  }

  try {
    const query = `
      WITH sessions_today AS (
        SELECT user_id, status, start_time, end_time
        FROM session_agents
        WHERE DATE(start_time) = CURRENT_DATE
          AND user_id = $1
          AND end_time IS NOT NULL  -- Exclure sessions actives
      ),
      cumuls AS (
        SELECT user_id, status, SUM(EXTRACT(EPOCH FROM (end_time - start_time))::INT) AS sec
        FROM sessions_today
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
    console.error("Erreur getSessionAgent:", err);
    res.status(500).json({ error: "Erreur récupération session live" });
  }
};


// Utilitaire pour formater les secondes en HH:MM:SS
function formatSecondsToHMS(seconds) {
  if (seconds == null || seconds < 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

// GET /api/sessions/admin - Récupérer les sessions des agents pour l'admin avec filtres
exports.getSessionAgentsForRH = async (req, res) => {
  try {
    const { startDate, endDate, userIds = [] } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate et endDate sont obligatoires" });
    }

    const userIdsArray = Array.isArray(userIds)
      ? userIds.map(id => parseInt(id, 10))
      : userIds ? [parseInt(userIds, 10)] : [];
    const hasUsers = userIdsArray.length > 0;

    // 1) Cumuls
    let cumulsQuery = `
      SELECT d.id, d.user_id, d.day AS session_date,
             d.travail_sec AS travail, d.pauses_sec AS pauses
      FROM daily_agent_cumul d
      WHERE d.day BETWEEN $1 AND $2
    `;
    const cumulsParams = [startDate, endDate];
    if (hasUsers) {
      cumulsQuery += " AND d.user_id = ANY($3)";
      cumulsParams.push(userIdsArray);
    }
    const cumulsRes = await db.query(cumulsQuery, cumulsParams);
    const cumulsMap = new Map(cumulsRes.rows.map(c => [
      `${c.user_id}-${c.session_date.toISOString().split("T")[0]}`, c
    ]));

    // 2) Connexions / sessions
    const query = `
      WITH sessions AS (
        SELECT sa.user_id,
               DATE(sa.start_time) AS session_date,
               sa.start_time, sa.end_time, sa.status
        FROM session_agents sa
        WHERE DATE(sa.start_time) BETWEEN $1 AND $2
        ${hasUsers ? `AND sa.user_id = ANY($3)` : ""}
      ),
      connexions AS (
        SELECT user_id,
               DATE(event_time) AS session_date,
               MIN(event_time) FILTER (WHERE event_type='connect') AS arrival_time,
               MAX(event_time) FILTER (
                 WHERE event_type IN ('disconnect','disconnectByAdmin','auto_disconnect')
               ) AS departure_time
        FROM agent_connections_history
        WHERE DATE(event_time) BETWEEN $1 AND $2
        ${hasUsers ? `AND user_id = ANY($3)` : ""}
        GROUP BY user_id, DATE(event_time)
      ),
      statut_bounds AS (
        SELECT user_id,
               session_date,
               MIN(start_time) AS status_first_start,
               MAX(end_time) AS status_last_end
        FROM sessions
        GROUP BY user_id, session_date
      )
      SELECT u.id AS user_id, u.firstname, u.lastname,
             sb.session_date, cx.arrival_time, cx.departure_time,
             sb.status_first_start, sb.status_last_end
      FROM statut_bounds sb
      LEFT JOIN connexions cx
        ON cx.user_id = sb.user_id AND cx.session_date = sb.session_date
      JOIN users u ON u.id = sb.user_id
      ORDER BY sb.session_date DESC, u.lastname, u.firstname;
    `;

    const params = [startDate, endDate];
    if (hasUsers) params.push(userIdsArray);

    const { rows } = await db.query(query, params);

    // 3) Fusion cumuls
    const finalRows = rows.map(r => {
      const key = `${r.user_id}-${r.session_date.toISOString().split("T")[0]}`;
      const c = cumulsMap.get(key) || { id: null, travail: 0, pauses: 0 };
      return {
        ...r,
        cumul_id: c.id,
        travail: c.travail,
        pauses: c.pauses,
        presence: c.travail + c.pauses
      };
    });

    res.json(finalRows);

  } catch (err) {
    console.error("Erreur getSessionAgentsForRH:", err);
    res.status(500).json({ error: "Erreur récupération sessions admin" });
  }
};

// GET /api/sessions/admin/export
exports.exportSessionAgentsForRH = async (req, res) => {
  try {
    const { startDate, endDate, userIds = [] } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate et endDate sont obligatoires" });
    }

    const userIdsArray = Array.isArray(userIds)
      ? userIds.map(id => parseInt(id, 10))
      : userIds ? [parseInt(userIds, 10)] : [];
    const hasUsers = userIdsArray.length > 0;

    // 1) Cumuls
    let cumulsQuery = `
      SELECT user_id, day AS session_date, travail_sec AS travail, pauses_sec AS pauses
      FROM daily_agent_cumul
      WHERE day BETWEEN $1 AND $2
    `;
    const cumulsParams = [startDate, endDate];
    if (hasUsers) {
      cumulsQuery += " AND user_id = ANY($3)";
      cumulsParams.push(userIdsArray);
    }
    const cumulsRes = await db.query(cumulsQuery, cumulsParams);
    const cumulsMap = new Map(cumulsRes.rows.map(c => [
      `${c.user_id}-${c.session_date.toISOString().split("T")[0]}`, c
    ]));

    // 2) Bornes sessions / connexions
    const query = `
      WITH sessions AS (
        SELECT user_id, DATE(start_time) AS session_date, start_time, end_time, status
        FROM session_agents
        WHERE DATE(start_time) BETWEEN $1 AND $2
        ${hasUsers ? `AND user_id = ANY($3)` : ""}
      ),
      connexions AS (
        SELECT user_id, DATE(event_time) AS session_date,
               MIN(event_time) FILTER (WHERE event_type='connect') AS arrival_time,
               MAX(event_time) FILTER (WHERE event_type IN ('disconnect','disconnectByAdmin','auto_disconnect')) AS departure_time
        FROM agent_connections_history
        WHERE DATE(event_time) BETWEEN $1 AND $2
        ${hasUsers ? `AND user_id = ANY($3)` : ""}
        GROUP BY user_id, DATE(event_time)
      ),
      statut_bounds AS (
        SELECT user_id, session_date, MIN(start_time) AS status_first_start, MAX(end_time) AS status_last_end
        FROM sessions
        GROUP BY user_id, session_date
      )
      SELECT u.id AS user_id, u.firstname, u.lastname,
             sb.session_date, cx.arrival_time, cx.departure_time,
             sb.status_first_start, sb.status_last_end
      FROM statut_bounds sb
      LEFT JOIN connexions cx
        ON cx.user_id = sb.user_id AND cx.session_date = sb.session_date
      JOIN users u ON u.id = sb.user_id
      ORDER BY u.lastname, u.firstname, sb.session_date;
    `;

    const params = [startDate, endDate];
    if (hasUsers) params.push(userIdsArray);

    const { rows } = await db.query(query, params);

    // 3) Fusion cumuls + format HH:MM:SS
    const finalRows = rows.map(r => {
      const key = `${r.user_id}-${r.session_date.toISOString().split("T")[0]}`;
      const c = cumulsMap.get(key) || { travail: 0, pauses: 0 };
      return {
        ...r,
        travail: c.travail,
        pauses: c.pauses,
        presence: c.travail + c.pauses,
        travail_hhmm: formatSecondsToHMS(c.travail),
        pauses_hhmm: formatSecondsToHMS(c.pauses)
      };
    });

    res.json(finalRows);

  } catch (err) {
    console.error("Erreur exportSessionAgentsForRH:", err);
    res.status(500).json({ error: "Erreur export sessions" });
  }
};


exports.getDailyConnectionTimes = async (req, res) => {
  try {
    const query = `
      SELECT 
        user_id,
        MIN(event_time) FILTER (WHERE event_type = 'connect') AS first_connection,
        MAX(event_time) FILTER (WHERE event_type IN ('disconnect', 'disconnectByAdmin', 'auto_disconnect')) AS last_disconnection
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

// POST /export-sessions par l'admin
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
          COALESCE(sa.duration, 0) AS duree_sec
        FROM session_agents sa
        WHERE DATE(sa.start_time) BETWEEN $1 AND $2
        AND sa.end_time IS NOT NULL
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
  COALESCE(ls.statut_actuel, 'Hors ligne') AS statut_actuel,
  COALESCE(ls.depuis_sec, 0) AS depuis_sec,
  COALESCE(ct.presence_totale_sec, 0) AS presence_totale_sec,
  COALESCE(cj.cumul_statuts, '{}'::json) AS cumul_statuts,
  co.first_connection,
  co.last_disconnection,
  COALESCE(ct.session_date, cj.session_date, co.session_date, ls.session_date) AS session_date
FROM users u
LEFT JOIN cumul_total ct ON ct.user_id = u.id
LEFT JOIN cumul_json cj ON cj.user_id = u.id AND cj.session_date = ct.session_date
LEFT JOIN last_status ls ON ls.user_id = u.id AND ls.session_date = ct.session_date
LEFT JOIN connections co ON co.user_id = u.id AND co.session_date = ct.session_date
WHERE (
  (ct.session_date BETWEEN $1 AND $2)
  OR (cj.session_date BETWEEN $1 AND $2)
  OR (ls.session_date BETWEEN $1 AND $2)
  OR (co.session_date BETWEEN $1 AND $2)
)
${userFilter ? "AND u.id = ANY($3)" : ""}
ORDER BY u.lastname, u.firstname, session_date;
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


//Obtenir les statuts et le cumul mensuel d'un agent
exports.getMonthlySessions = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) return res.status(400).json({ error: "User ID manquant" });

    const startDate = req.query.startDate
      ? dayjs(req.query.startDate).format("YYYY-MM-DD")
      : dayjs().startOf("month").format("YYYY-MM-DD");

    const endDate = req.query.endDate
      ? dayjs(req.query.endDate).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD");

    // 🔹 Récupérer les cumuls depuis daily_agent_cumul
    const query = `
      SELECT 
        day AS session_date,
        travail_sec AS travail,
        pauses_sec AS pauses,
        (travail_sec + pauses_sec) AS presence
      FROM daily_agent_cumul
      WHERE user_id = $1
        AND day BETWEEN $2 AND $3
      ORDER BY day ASC
    `;

    const { rows } = await db.query(query, [userId, startDate, endDate]);

    // 🔹 Calcul du cumul travail (cumul_travail)
    let cumulTravail = 0;
    const finalRows = rows.map(r => {
      cumulTravail += r.travail;
      return {
        ...r,
        indispo: 0, // si tu veux, tu peux ajouter indispo séparé si tu stockes aussi
        cumul_travail: cumulTravail
      };
    });

    res.json(finalRows);

  } catch (err) {
    console.error("Erreur getMonthlySessions:", err);
    res.status(500).json({ error: "Erreur récupération sessions mensuelles" });
  }
};


exports.getMonthlySessionsFiltre = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const { startDate, endDate } = req.query;

    if (!userId) return res.status(400).json({ error: "User ID manquant" });
    if (!startDate) return res.status(400).json({ error: "startDate est obligatoire" });

    const start = dayjs(startDate).format("YYYY-MM-DD");
    const end = endDate ? dayjs(endDate).format("YYYY-MM-DD") : start;

    // 🔹 Récupérer les cumuls depuis daily_agent_cumul
    const query = `
      SELECT 
        day AS session_date,
        travail_sec AS travail,
        pauses_sec AS pauses,
        (travail_sec + pauses_sec) AS presence
      FROM daily_agent_cumul
      WHERE user_id = $1
        AND day BETWEEN $2 AND $3
      ORDER BY day ASC
    `;

    const { rows } = await db.query(query, [userId, start, end]);

    // 🔹 Calcul du cumul_travail
    let cumulTravail = 0;
    const finalRows = rows.map(r => {
      cumulTravail += r.travail;
      return {
        ...r,
        indispo: 0, // si tu veux l'indispo, il faudrait le stocker ou calculer à part
        cumul_travail: cumulTravail
      };
    });

    res.json(finalRows);

  } catch (err) {
    console.error("Erreur getMonthlySessionsFiltre:", err);
    res.status(500).json({ error: "Erreur récupération sessions filtrées" });
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
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 00:00:00 du jour courant

    // Récupérer les sessions encore ouvertes DONT le start_time est AVANT aujourd'hui
    const activeSessions = await db.query(`
      SELECT id, user_id, start_time
      FROM session_agents
      WHERE end_time IS NULL
        AND start_time < $1
    `, [today]);

    for (const session of activeSessions.rows) {
      const { user_id } = session;

      // 1. Clôturer la session à 23:59:59 de la veille
      await db.query(`
        UPDATE session_agents
        SET end_time = DATE_TRUNC('day', NOW()) - INTERVAL '1 second'
        WHERE user_id = $1 AND end_time IS NULL AND start_time < $2
      `, [user_id, today]);

      console.log(`✅ Session de l'agent ${user_id} splittée à minuit (23:59:59 → 00:00:00)`);
    }

    if (activeSessions.rows.length === 0) {
      console.log("ℹ️ Aucune session à splitter à minuit.");
    }

  } catch (err) {
    console.error("❌ Erreur dans splitSessionsAtMidnight :", err.message || err);
  }
};

// controllers/sessionControllers.js

exports.closeForceSession = async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ message: "❌ user_id est requis" });
    }

    const sessionResult = await db.query(
      `UPDATE session_agents
       SET end_time = NOW(),
           duration = EXTRACT(EPOCH FROM (NOW() - start_time))
       WHERE user_id = $1 AND end_time IS NULL
       RETURNING *`,
      [user_id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(200).json({ message: "ℹ️ Aucune session active à fermer" });
    }

    await db.query("UPDATE users SET is_connected = FALSE WHERE id = $1", [user_id]);
    await db.query(
      "INSERT INTO agent_connections_history (user_id, event_type) VALUES ($1, 'disconnect_force')",
      [user_id]
    );

    res.json({
      message: "✅ Session fermée avec succès",
      session: sessionResult.rows[0]
    });

  } catch (err) {
    console.error("❌ Erreur dans closeForceSession:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};



/**
 * Récupère le dernier statut actif d’un agent
 * @param {number|string} userId 
 * @returns {Promise<string|null>} statut ou null si rien trouvé
 */


// 🔹 Fonction utilitaire interne (non exportée directement comme route)
const fetchLastAgentStatus = async (userId) => {
  try {
    const result = await db.query(
      `SELECT status
       FROM session_agents
       WHERE user_id = $1
       ORDER BY start_time DESC
       LIMIT 1`,
      [userId]
    );
    return result.rows[0]?.status || null;
  } catch (err) {
    console.error("❌ Erreur fetchLastAgentStatus:", err);
    throw err;
  }
};

// 🔹 Contrôleur Express compatible avec router.get(...)
exports.getLastAgentStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const status = await fetchLastAgentStatus(userId);

    if (status === null) {
      return res.status(404).json({ message: "Aucun statut trouvé pour cet agent." });
    }

    res.json({ status });
  } catch (err) {
    console.error("❌ Erreur route /last-status:", err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération du statut" });
  }
};

// 🔹 Tu exportes aussi la fonction interne si tu veux la réutiliser ailleurs
exports.fetchLastAgentStatus = fetchLastAgentStatus;


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

exports.getAllHistorySessions = async (req, res) => {
  const userId = req.params.id;
  const { from, to, type } = req.query; // filtre optionnel : date et type (connexion, deconnexion, status_change, etc.)

  try {
    // === Préparer filtres ===
    let sessionQuery = `SELECT * FROM session_agents WHERE user_id = $1`;
    let connQuery = `SELECT * FROM agent_connections_history WHERE user_id = $1`;
    const paramsSessions = [userId];
    const paramsConns = [userId];

    // === Filtrer par date ===
    if (from) {
      paramsSessions.push(from + " 00:00:00");
      paramsConns.push(from + " 00:00:00");
      sessionQuery += ` AND start_time >= $${paramsSessions.length}`;
      connQuery += ` AND event_time >= $${paramsConns.length}`;
    } else {
      // Par défaut aujourd'hui
      sessionQuery += ` AND start_time >= CURRENT_DATE`;
      connQuery += ` AND event_time >= CURRENT_DATE`;
    }

    if (to) {
      paramsSessions.push(to + " 23:59:59");
      paramsConns.push(to + " 23:59:59");
      sessionQuery += ` AND start_time <= $${paramsSessions.length}`;
      connQuery += ` AND event_time <= $${paramsConns.length}`;
    }

    // === Récupérer les sessions ===
    sessionQuery += ` ORDER BY start_time ASC`;
    const sessionsResult = await db.query(sessionQuery, paramsSessions);
    const sessions = sessionsResult.rows;

    // === Récupérer les connexions ===
    connQuery += ` ORDER BY event_time ASC`;
    const connsResult = await db.query(connQuery, paramsConns);
    const conns = connsResult.rows;

    let history = [];
    let lastStatus = null;

    // === Transformer les sessions en événements lisibles ===
    sessions.forEach((s) => {
      let narrative = "";
      const isForcedPause = s.pause_type && s.pause_type.toLowerCase().includes("forcée par");

      // --- Cas 1 : pause forcée (toujours afficher même si statut identique)
      if (isForcedPause) {
        narrative = `Statut changé en "${s.status}": (${s.pause_type}).`;
      }

      // --- Cas 2 : première entrée (aucun statut précédent)
      else if (!lastStatus) {
        narrative = `L'agent est passé en "${s.status}".`;
        if (s.pause_type) narrative += ` (pause : ${s.pause_type})`;
      }

      // --- Cas 3 : changement réel de statut
      else if (lastStatus !== s.status) {
        narrative = `L'agent est passé de "${lastStatus}" à "${s.status}".`;
        if (s.pause_type) narrative += ` (pause : ${s.pause_type})`;
      }

      // --- Cas 4 : statut identique → on ignore l’entrée
      else {
        lastStatus = s.status; // on met à jour mais on n’ajoute rien
        return;
      }

      // ---- On ajoute dans l’historique uniquement les cas valides
      if (!type || type === "status_change") {
        history.push({
          timestamp: s.start_time,
          type: "status_change",
          status_before: lastStatus,
          status_after: s.status,
          pause_type: s.pause_type,
          admin_id: null,
          admin_name: null,
          narrative
        });
      }

      lastStatus = s.status;
    });

    // === Transformer les connexions en événements ===
    conns.forEach((c) => {
      let event = null;
      switch (c.event_type) {
        case "connect":
          event = { timestamp: c.event_time, type: "connexion", narrative: "L'agent s'est connecté.", admin_id: null, admin_name: null };
          break;
        case "disconnect":
          event = { timestamp: c.event_time, type: "deconnexion", narrative: "L'agent s'est déconnecté.", admin_id: null, admin_name: null };
          break;
        case "disconnectByAdmin":
          event = { timestamp: c.event_time, type: "deconnexion_forcee", narrative: `L'agent a été déconnecté par ${c.admin_name}.`, admin_id: c.admin_id, admin_name: c.admin_name };
          break;
        case "auto_disconnect":
          event = { timestamp: c.event_time, type: "deconnexion_systeme", narrative: "L'agent a été déconnecté automatiquement pour inactivité.", admin_id: null, admin_name: null };
          break;
      }
      if (event && (!type || event.type === type)) history.push(event);
    });

    // === Tri descendant par date ===
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(history);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// les Détails sur les  cumuls d'un agent
exports.getSessionDetailsOptimized = async (req, res) => {
  try {
    const { userId, date } = req.params;

    if (!userId || !date) {
      return res.status(400).json({ error: "userId ou date manquant" });
    }

    // 🔹 On récupère les cumuls globaux depuis daily_agent_cumul
    const query = `
      SELECT
        travail_sec,
        pauses_sec,
        is_corrected
      FROM daily_agent_cumul
      WHERE user_id = $1
        AND day = $2
    `;
    const { rows } = await db.query(query, [userId, date]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Aucun cumul trouvé pour cet utilisateur à cette date" });
    }

    const { travail_sec, pauses_sec, is_corrected } = rows[0];

    // 🔹 On récupère les détails par statut depuis session_agents (très léger pour 1 jour)
    const detailsQuery = `
      SELECT status, EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time))::int AS sec
      FROM session_agents
      WHERE user_id = $1 AND DATE(start_time) = $2
    `;
    const { rows: detailRows } = await db.query(detailsQuery, [userId, date]);

    // 🔹 Construction de l'objet cumul_statuts
    const cumul_statuts = {};
    detailRows.forEach(r => {
      cumul_statuts[r.status] = (cumul_statuts[r.status] || 0) + r.sec;
    });

    // 🔹 Calcul des totaux pour compatibilité frontend
    const TotalPause =
      (cumul_statuts["Pausette 1"] || 0) +
      (cumul_statuts["Déjeuner"] || 0) +
      (cumul_statuts["Pausette 2"] || 0);

    const TotalIndispo =
      (cumul_statuts["Réunion"] || 0) +
      (cumul_statuts["Formation"] || 0) +
      (cumul_statuts["Brief"] || 0);

    const HeureTravail = (cumul_statuts["Disponible"] || 0) + TotalIndispo;
    const PresenceTotale = HeureTravail + TotalPause;

    res.json({
      userId,
      date,
      cumul_statuts,
      totals: {
        TotalPause,
        TotalIndispo,
        HeureTravail,
        PresenceTotale,
      },
      is_corrected
    });

  } catch (err) {
    console.error("Erreur getSessionDetailsOptimized:", err);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// obtenir les cumuls journaliers des agents
exports.getDailyCumuls = async (req, res) => {
  try {
    const { startDate, endDate, userIds = [] } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate et endDate obligatoires" });
    }

    let query = `
      SELECT 
        d.user_id, u.firstname, u.lastname, d.day,
        d.travail_sec, d.pauses_sec, d.presence_sec,
        d.is_corrected, d.corrected_by, d.old_values, d.new_values,
        d.updated_at
      FROM daily_agent_cumul d
      JOIN users u ON u.id = d.user_id
      WHERE d.day BETWEEN $1 AND $2
    `;
    const params = [startDate, endDate];

    if (userIds.length > 0) {
      query += " AND d.user_id = ANY($3)";
      params.push(userIds.map(Number));
    }

    query += " ORDER BY d.day DESC, u.lastname, u.firstname";

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("Erreur getDailyCumuls:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// correction des cumuls journaliers
exports.correctCumul = async (req, res) => {
  try {
    // 🔹 1) Récupérer et valider l'ID
    const idNum = Number(req.params.id);
    if (isNaN(idNum)) return res.status(400).json({ message: "ID invalide." });

    // 🔹 2) Récupérer et valider les valeurs envoyées
    const { travail_sec, pauses_sec, presence_sec } = req.body || {};

    if (travail_sec === undefined || pauses_sec === undefined || presence_sec === undefined) {
      return res.status(400).json({ message: "Tous les champs travail_sec, pauses_sec, presence_sec sont obligatoires." });
    }

    const t = Number(travail_sec);
    const p = Number(pauses_sec);
    const pr = Number(presence_sec);

    if ([t, p, pr].some(v => isNaN(v))) {
      return res.status(400).json({ message: "Les valeurs doivent être numériques." });
    }
    if (t < 0 || p < 0 || pr < 0) {
      return res.status(400).json({ message: "Les durées ne peuvent pas être négatives." });
    }
    if (t + p > pr) {
      return res.status(400).json({ message: "travail_sec + pauses_sec doit être ≤ presence_sec." });
    }

    // 🔹 3) Récupérer la ligne existante
    const oldRes = await db.query("SELECT * FROM daily_agent_cumul WHERE id = $1", [idNum]);
    const old = oldRes.rows[0];
    if (!old) return res.status(404).json({ message: "Cumul introuvable." });

    // 🔹 4) Détecter les changements
    const changes = [];
    if (old.travail_sec !== t) changes.push(`travail_sec: ${old.travail_sec} → ${t}`);
    if (old.pauses_sec !== p) changes.push(`pauses_sec: ${old.pauses_sec} → ${p}`);
    if (old.presence_sec !== pr) changes.push(`presence_sec: ${old.presence_sec} → ${pr}`);
    if (changes.length === 0) return res.status(400).json({ message: "Aucun changement détecté." });

    // 🔹 5) Construire le commentaire
    const adminId = req.user?.id || null;
    const adminName = `${req.user?.firstname || ""} ${req.user?.lastname || ""}`.trim() || "Admin inconnu";
    const autoComment = `Correction cumul du ${old.day} par ${adminName} — ${changes.join(" , ")}`;

    // 🔹 6) Update
    const result = await db.query(
      `UPDATE daily_agent_cumul
       SET travail_sec = $1,
           pauses_sec = $2,
           presence_sec = $3,
           is_corrected = TRUE,
           corrected_by = $4,
           old_values = $5,
           new_values = $6,
           commentaire = $7,
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        t,
        p,
        pr,
        adminId,
        JSON.stringify({ travail_sec: old.travail_sec, pauses_sec: old.pauses_sec, presence_sec: old.presence_sec }),
        JSON.stringify({ travail_sec: t, pauses_sec: p, presence_sec: pr }),
        autoComment,
        idNum
      ]
    );

    // 🔹 7) Vérifier si l'UPDATE a affecté une ligne
    if (!result.rows[0]) {
      console.error(`correctCumul: UPDATE n'a affecté aucune ligne pour id=${idNum}`);
      return res.status(404).json({ message: "La mise à jour n'a affecté aucune ligne." });
    }

    // 🔹 8) Réponse
    res.status(200).json({
      message: "Cumul corrigé avec succès.",
      updated: result.rows[0],
      commentaire: autoComment
    });

  } catch (error) {
    console.error("Erreur correctCumul :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// controllers/sessionControllers.js

exports.cleanShift = async (req, res) => {
  const { startDate, endDate, userIds } = req.body;

  try {
    if (!startDate) {
      return res.status(400).json({ success: false, message: "startDate obligatoire" });
    }

    await cronCleanShift({ startDate, endDate, userIds });

    res.json({ success: true, message: "Nettoyage effectué !" });
  } catch (err) {
    console.error("Erreur clean-shift manuel:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
