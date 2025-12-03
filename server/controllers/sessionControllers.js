// server/controllers/sessionControllers.js
const db = require('../db');
const dayjs = require("dayjs");
const { getIo } = require("../socketInstance");

// ----------------------------- NOUVELLE GESTION DU TIMER VIA BACKEND -------------------

// ⚡ Limites horaires pour la journée
const CLAMP_START = "16:18:00"; // Début max de la session
const CLAMP_END = "16:20:00";   // Fin max pour le stockage des statuts

// Ajuste startTime pour qu’il ne soit jamais avant CLAMP_START
const clampStartTime = (dt) => {
  const today = dt.toISOString().split("T")[0]; // YYYY-MM-DD
  const clamp = new Date(`${today}T${CLAMP_START}`);
  return dt < clamp ? clamp : dt;
};

// Ajuste endTime pour qu’il ne soit jamais après CLAMP_END
const clampEndTime = (dt) => {
  const today = dt.toISOString().split("T")[0]; // YYYY-MM-DD
  const clamp = new Date(`${today}T${CLAMP_END}`);
  return dt > clamp ? clamp : dt;
};

exports.clampStartTime = clampStartTime;
exports.clampEndTime = clampEndTime;

exports.startSession = async (req, res) => {
  const { user_id, status = "Disponible", pause_type = null } = req.body;
  if (!user_id) return res.status(400).json({ error: "user_id requis" });

  try {
    const now = new Date();

    // Vérifier si une session est active → on NE CLAMP PAS
    const existing = await db.query(
      `SELECT id FROM session_agents 
       WHERE user_id = $1 AND end_time IS NULL 
       LIMIT 1`,
      [user_id]
    );

    if (existing.rowCount > 0) {
      // Notifier les admins du changement de statut
      const io = getIo();
      io.to("admins").emit("agent_status_changed", {
        userId: user_id,
        newStatus: status
      });

      return res.json({
        success: true,
        reused: true,
        session_id: existing.rows[0].id
      });
    }

    // ----------------------------------------
    // 🎯 Première session → clamp strict
    // ----------------------------------------
    const cStart = clampStartTime(now);
    const cEnd = clampEndTime(now);

    // impossible de commencer après la fin
    let startTime = now;

    if (now < cStart) startTime = cStart;
    if (now > cEnd) startTime = cEnd;

    // ======================================
    // INSERT nouvelle session
    // ======================================
    const result = await db.query(
      `INSERT INTO session_agents 
        (user_id, status, pause_type, start_time, last_ping)
       VALUES ($1, $2, $3, $4, $4)
       RETURNING id, start_time`,
      [user_id, status, pause_type, startTime.toISOString()]
    );

    // Notify admins
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
    console.error("startSession error", err);
    res.status(500).json({ error: "server error" });
  }
};


// =========================================================
// 🛑 STOP SESSION
// =========================================================
exports.stopSession = async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: "user_id requis" });

  try {
    const now = new Date();
    const cEnd = clampEndTime(now);

    // Récupérer session active
    const active = await db.query(
      `SELECT id, start_time 
         FROM session_agents 
        WHERE user_id = $1 AND end_time IS NULL
        LIMIT 1`,
      [user_id]
    );

    if (active.rowCount === 0) {
      return res.json({ success: true, message: "no active session" });
    }

    const session = active.rows[0];
    let startTime = new Date(session.start_time);

    // sécurité : ne jamais laisser start > end
    if (startTime > cEnd) startTime = cEnd;

    // ======================================
    // UPDATE duration + end_time
    // ======================================
    const result = await db.query(
      `UPDATE session_agents
          SET end_time = $1,
              duration = EXTRACT(EPOCH FROM ($1::timestamp - $2::timestamp))::INT
        WHERE id = $3
        RETURNING *`,
      [cEnd.toISOString(), startTime.toISOString(), session.id]
    );

    // notify
    const io = getIo();
    io.to("admins").emit("agent_status_changed", {
      userId: user_id,
      newStatus: "Hors Ligne"
    });

    res.json({
      success: true,
      session: result.rows[0]
    });

  } catch (err) {
    console.error("stopSession error", err);
    res.status(500).json({ error: "server error" });
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

exports.closeSessionForce = async (userId, userSockets, adminId) => {
  try {
    console.log(`[SERVER] closeSessionForce called for user ${userId}`);

    const io = getIo();

    // 1️⃣ Vérifier session active
    const check = await db.query(
      `SELECT id FROM session_agents
       WHERE user_id = $1 AND end_time IS NULL
       ORDER BY start_time DESC LIMIT 1`,
      [userId]
    );

    let session = null;

    if (check.rowCount > 0) {
      session = await db.query(
        `UPDATE session_agents
   SET end_time = $2,
       duration = EXTRACT(EPOCH FROM ($2 - start_time))::INT
   WHERE id = $1
   RETURNING id, start_time, end_time, duration`,
        [check.rows[0].id, clampEndTime(new Date())] // ⚡ clamp
      );
      session = session.rows[0];

      console.log(`[SERVER] Session clôturée pour ${userId}`);
    } else {
      console.log(`[SERVER] Aucune session active → statut null, on déconnecte quand même.`);
    }

    // 2️⃣ Déconnecter l'agent
    await db.query("UPDATE users SET is_connected = FALSE WHERE id = $1", [userId]);

    // 3️⃣ Historique
    await db.query(
      `INSERT INTO agent_connections_history (user_id, event_type, admin_id) VALUES ($1, 'disconnectByAdmin', $2)`,
      [userId, adminId]
    );

    // 4️⃣ Notifier admins
    io.to("admins").emit("agent_status_changed", {
      userId,
      newStatus: "Hors ligne"
    });

    io.to("admins").emit("agent_disconnected_for_admin", {
      userId,
      newStatus: "Hors ligne"
    });

    // 5️⃣ Notifier l’agent
    io.to(`agent_${userId}`).emit("force_disconnect_by_admin", {
      userId,
      reason: "Déconnecté par l’administrateur",
      forced: true
    });

    // 6️⃣ Déconnecter sockets physiquement
    const sockets = userSockets.get(userId);
    if (sockets) {
      sockets.forEach(socketId => {
        const s = io.sockets.sockets.get(socketId);
        if (s) {
          setTimeout(() => {
            s.disconnect(true);
          }, 100);
        }
      });
      userSockets.delete(userId);
    }

    return session;

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
    console.log(`[BACK] 🔄 forcePauseByAdmin appelé par admin ${requester.id} sur user ${userId}`);

    const { rows: adminRows } = await db.query(
      `SELECT firstname, lastname FROM users WHERE id = $1`,
      [requester.id]
    );
    const admin = adminRows[0];
    const adminName = admin ? `${admin.firstname} ${admin.lastname}` : "Administrateur";
    console.log(`[BACK] Admin: ${adminName}`);


    if (!userId) {
      console.log(`[BACK] ❌ userId manquant`);
      return res.status(400).json({ error: "userId manquant." });
    }

    // Vérifier que l'utilisateur est un admin
    if (requester.role !== "Admin") {
      console.log(`[BACK] ❌ Role non autorisé: ${requester.role}`);
      return res
        .status(403)
        .json({ error: "Vous n'avez pas la permission de mettre un agent en pause." });
    }

    // Vérifier que l'agent est connecté (table users)
    const { rows: userRows } = await db.query(
      `SELECT is_connected, session_closed
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userRows.length === 0) {
      console.log(`[BACK] ❌ Agent introuvable: ${userId}`);
      return res.status(404).json({ error: "Agent introuvable." });
    }

    const { is_connected, session_closed } = userRows[0];
    console.log(`[BACK] Agent ${userId} connecté? ${is_connected}, session_closed? ${session_closed}`);


    if (!is_connected || session_closed) {
      console.log(`[BACK] ❌ Impossible de forcer la pause`);
      return res.status(400).json({
        error: "Impossible de forcer la pause : l'agent n'est pas connecté ou sa session est fermée.",
      });
    }

    // ✅ Vérifier que l'agent a une session active dans session_agents
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
      console.log(`[BACK] ❌ Aucune session active trouvée pour ${userId}`);
      return res.status(400).json({
        error: "Aucune session active trouvée pour cet agent.",
      });
    }

    const currentSession = sessionRows[0];

    // Vérifier que le statut est "Disponible"
    if (currentSession.status !== "Disponible") {
      return res.status(400).json({
        error: `Pause non forcée : l'agent est actuellement en "${currentSession.status}".`,
      });
    }

    const now = clampEndTime(new Date());

    // Fermer la session actuelle (Disponible)
    await db.query(
      `UPDATE session_agents
       SET end_time = $1,
           duration = EXTRACT(EPOCH FROM ($1 - start_time))
       WHERE id = $2`,
      [now, currentSession.id]
    );

    // Créer une nouvelle session "Déjeuner" forcée
    await db.query(
      `INSERT INTO session_agents (user_id, status, start_time, pause_type)
       VALUES ($1, $2, $3, $4)`,
      [userId, "Déjeuner", now, `Action forcée par ${adminName}`]
    );

    // Émettre les événements Socket.IO
    const io = getIo();
    console.log(`[BACK] ⚡ Émission socket "agent_status_changed" et "force_pause_by_admin"`);
    io.to("admins").emit("agent_status_changed", { userId, newStatus: "Déjeuner" });
    io.to(`agent_${userId}`).emit("force_pause_by_admin", {
      reason: "Pause forcée par l’administrateur",
      pause_type: "Déjeuner",
      forced: true,
    });

    res.json({
      success: true,
      message: "L'agent est maintenant en pause déjeuner (forcée).",
    });
    console.log(`[BACK] ✅ forcePauseByAdmin terminé pour ${userId}`);

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

// GET /api/sessions/admin - Récupérer les sessions des agents pour l'admin avec filtres
exports.getSessionAgentsForRH = async (req, res) => {
  try {
    const { startDate, endDate, userIds = [] } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate et endDate sont obligatoires" });
    }

    const userFilter = userIds.length ? `AND sa.user_id = ANY($3)` : "";

    const query = `
      -- 1) Sessions agents (travail / pause)
      WITH sessions AS (
        SELECT
          sa.user_id,
          DATE(sa.start_time) AS session_date,
          sa.status,
          EXTRACT(EPOCH FROM (COALESCE(sa.end_time, NOW()) - sa.start_time))::INT AS duree_sec
        FROM session_agents sa
        WHERE DATE(sa.start_time) BETWEEN $1 AND $2
        ${userFilter}
      ),

      mapped AS (
        SELECT
          user_id,
          session_date,
          CASE
            WHEN status ILIKE ANY(ARRAY['Disponible','Réunion','Formation','Brief'])
              THEN 'travail'
            WHEN status ILIKE ANY(ARRAY['Déjeuner','Pausette 1','Pausette 2'])
              THEN 'pause'
            ELSE 'autre'
          END AS category,
          duree_sec
        FROM sessions
      ),

      cumuls AS (
        SELECT
          user_id,
          session_date,
          SUM(CASE WHEN category='travail' THEN duree_sec ELSE 0 END) AS travail,
          SUM(CASE WHEN category='pause' THEN duree_sec ELSE 0 END) AS pauses
        FROM mapped
        GROUP BY user_id, session_date
      ),

      -- 2) Connexions / déconnexions réelles
      connexions AS (
        SELECT
          user_id,
          DATE(event_time) AS session_date,
          MIN(event_time) FILTER (WHERE event_type='connect') AS first_connection,
          MAX(event_time) FILTER (
              WHERE event_type IN ('disconnect','disconnectByAdmin','auto_disconnect')
          ) AS last_disconnection
        FROM agent_connections_history
        WHERE DATE(event_time) BETWEEN $1 AND $2
        GROUP BY user_id, DATE(event_time)
      )

      -- 3) Fusion des deux
      SELECT 
        u.id AS user_id,
        u.firstname,
        u.lastname,
        c.session_date,
        cx.first_connection AS start_time,
        cx.last_disconnection AS end_time,
        c.travail,
        c.pauses
      FROM cumuls c
      JOIN connexions cx
        ON cx.user_id = c.user_id
       AND cx.session_date = c.session_date
      JOIN users u ON u.id = c.user_id
      ORDER BY u.lastname, u.firstname, c.session_date;
    `;

    const params = [startDate, endDate];
    if (userIds.length) params.push(userIds);

    const { rows } = await db.query(query, params);

    res.json(rows);

  } catch (err) {
    console.error("Erreur getSessionAgentsForRH:", err);
    res.status(500).json({ error: "Erreur récupération sessions admin" });
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


// controllers/sessionAgentsController.js l'export pour un agent
exports.exportSessionsAgent = async (req, res) => {
  console.log("🔥 Requête reçue sur /export-sessions-agent");
  console.log("Body:", req.body);
  console.log("User:", req.user);
  try {
    const { startDate, endDate } = req.body;
    const userId = req.user?.id || req.body.userId; // selon ton système d’auth

    if (!userId) {
      console.log("❌ User ID manquant");
      return res.status(400).json({ error: "Utilisateur non identifié" });
    }
    if (!startDate || !endDate) {
      console.log("❌ Dates manquantes");
      return res.status(400).json({ error: "startDate et endDate sont obligatoires" });
    }
    console.log("✅ Paramètres OK:", { userId, startDate, endDate });
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
          AND sa.user_id = $3
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
      cumul_json AS (
        SELECT user_id, session_date, json_object_agg(status, sec) AS cumul_statuts
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
          AND ach.user_id = $3
        GROUP BY ach.user_id, DATE(ach.event_time)
      )
      SELECT 
        u.id AS user_id,
        u.firstname,
        u.lastname,
        COALESCE(ct.presence_totale_sec, 0) AS presence_totale_sec,
        COALESCE(cj.cumul_statuts, '{}'::json) AS cumul_statuts,
        co.first_connection,
        co.last_disconnection,
        COALESCE(ct.session_date, cj.session_date, co.session_date) AS session_date
      FROM users u
      LEFT JOIN cumul_total ct ON ct.user_id = u.id
      LEFT JOIN cumul_json cj ON cj.user_id = u.id AND cj.session_date = ct.session_date
      LEFT JOIN connections co ON co.user_id = u.id AND co.session_date = ct.session_date
      WHERE u.id = $3
        AND (
          (ct.session_date BETWEEN $1 AND $2)
          OR (cj.session_date BETWEEN $1 AND $2)
          OR (co.session_date BETWEEN $1 AND $2)
        )
      ORDER BY session_date;
    `;

    const params = [startDate, endDate, userId];
    const { rows } = await db.query(query, params);
    res.json(rows);

  } catch (err) {
    console.error("Erreur exportAgentSessions:", err);
    res.status(500).json({ error: "Erreur export agent sessions" });
  }
}; // a supprimer 


exports.getMonthlySessions = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: "User ID manquant" });
    }

    const startDate = req.query.startDate
      ? dayjs(req.query.startDate).format("YYYY-MM-DD") // prend la date fournie.
      : dayjs().startOf("month").format("YYYY-MM-DD"); // Sinon par defaut le mois en cours.

    const endDate = req.query.endDate
      ? dayjs(req.query.endDate).format("YYYY-MM-DD") // prend la date fournie.
      : dayjs().format("YYYY-MM-DD"); // Sinon par defaut le mois en cours.

    const query = `
      WITH sessions AS (
        SELECT 
          sa.user_id,
          sa.status,
          DATE(sa.start_time) AS session_date,
          EXTRACT(EPOCH FROM (COALESCE(sa.end_time, NOW()) - sa.start_time))::INT AS duree_sec
        FROM session_agents sa
        WHERE sa.user_id = $1
          AND DATE(sa.start_time) BETWEEN $2 AND $3
      ),

      mapped AS (
        SELECT
          session_date,
          duree_sec,
          CASE
            WHEN status ILIKE 'Disponible' THEN 'dispo'
            WHEN status ILIKE ANY(ARRAY[
              'Déjeuner',
              'Pausette 1',
              'Pausette 2'
            ]) THEN 'pause'
            WHEN status ILIKE ANY(ARRAY[
              'Réunion',
              'Formation',
              'Brief'
            ]) THEN 'indispo'
            ELSE 'autre'
          END AS category
        FROM sessions
      ),

      cumuls AS (
        SELECT 
            session_date,
            SUM(CASE WHEN category = 'dispo'  THEN duree_sec ELSE 0 END) AS dispo,
            SUM(CASE WHEN category = 'pause'  THEN duree_sec ELSE 0 END) AS pauses,
            SUM(CASE WHEN category = 'indispo' THEN duree_sec ELSE 0 END) AS indispo,
            SUM(CASE WHEN category IN ('dispo','indispo') THEN duree_sec ELSE 0 END) AS travail
        FROM mapped
        GROUP BY session_date
      )

      SELECT
        session_date,
        dispo,
        pauses,
        indispo,
        travail,
        (travail + pauses) AS presence,
        SUM(travail) OVER (ORDER BY session_date ASC) AS cumul_travail
      FROM cumuls
      ORDER BY session_date DESC;
    `;

    const { rows } = await db.query(query, [userId, startDate, endDate]);

    // rows contains : session_date, dispo, pauses, indispo, travail, presence, cumul_travail (tous en secondes)
    res.json(rows);

  } catch (err) {
    console.error("Erreur getMonthlySessions:", err);
    res.status(500).json({ error: "Erreur récupération sessions mensuelles" });
  }
};


exports.getMonthlySessionsFiltre = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const { startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID manquant" });
    }
    if (!startDate) {
      return res.status(400).json({ error: "startDate est obligatoire" });
    }

    const start = dayjs(startDate).format("YYYY-MM-DD");
    const end = endDate ? dayjs(endDate).format("YYYY-MM-DD") : start;

    const query = `
      WITH sessions AS (
        SELECT 
          sa.user_id,
          sa.status,
          DATE(sa.start_time) AS session_date,
          EXTRACT(EPOCH FROM (COALESCE(sa.end_time, NOW()) - sa.start_time))::INT AS duree_sec
        FROM session_agents sa
        WHERE sa.user_id = $1
          AND DATE(sa.start_time) BETWEEN $2 AND $3
      ),

      mapped AS (
        SELECT
          session_date,
          duree_sec,
          CASE
            WHEN status ILIKE 'Disponible' THEN 'dispo'
            WHEN status ILIKE ANY(ARRAY[
              'Déjeuner',
              'Pausette 1',
              'Pausette 2'
            ]) THEN 'pause'
            WHEN status ILIKE ANY(ARRAY[
              'Réunion',
              'Formation',
              'Brief'
            ]) THEN 'indispo'
            ELSE 'autre'
          END AS category
        FROM sessions
      ),

      cumuls AS (
        SELECT 
            session_date,
            SUM(CASE WHEN category = 'dispo'  THEN duree_sec ELSE 0 END) AS dispo,
            SUM(CASE WHEN category = 'pause'  THEN duree_sec ELSE 0 END) AS pauses,
            SUM(CASE WHEN category = 'indispo' THEN duree_sec ELSE 0 END) AS indispo,
            SUM(CASE WHEN category IN ('dispo','indispo') THEN duree_sec ELSE 0 END) AS travail
        FROM mapped
        GROUP BY session_date
      )

      SELECT
        session_date,
        dispo,
        pauses,
        indispo,
        travail,
        (travail + pauses) AS presence,
        SUM(travail) OVER (ORDER BY session_date ASC) AS cumul_travail
      FROM cumuls
      ORDER BY session_date DESC;
    `;

    const { rows } = await db.query(query, [userId, start, end]);

    res.json(rows);

  } catch (err) {
    console.error("Erreur getSessionsByRange:", err);
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

// controllers/sessionControllers.js
exports.correctSession = async (req, res) => {
  try {
    const { userId, sessionDate, updates } = req.body;

    if (!userId || !sessionDate || !updates) {
      return res.status(400).json({ error: "Paramètres manquants" });
    }

    const statusesInOrder = [
      "Disponible",
      "Pausette 1",
      "Déjeuner",
      "Pausette 2",
      "Réunion",
      "Formation",
      "Brief"
    ];

    // 1) Supprimer toutes les sessions du jour
    await db.query(
      "DELETE FROM session_agents WHERE user_id = $1 AND DATE(start_time) = $2",
      [userId, sessionDate]
    );

    // 2) Reconstruction propre de la journée
    let cursor = `${sessionDate} 00:00:00`;

    for (const st of statusesInOrder) {
      const hours = updates[st] || 0;
      const seconds = hours;

      if (seconds <= 0) continue;

      const start = cursor;
      const endTime = new Date(new Date(cursor).getTime() + seconds * 1000);

      const pause_type = ["Pausette 1", "Pausette 2", "Déjeuner"].includes(st)
        ? st
        : null;

      await db.query(
        `INSERT INTO session_agents 
                (user_id, status, start_time, end_time, duration, pause_type, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          userId,
          st,
          start,
          endTime,
          seconds,
          pause_type
        ]
      );

      cursor = endTime;
    }

    return res.json({ message: "Correction appliquée avec succès" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};


exports.getSessionforCorrect = async (req, res) => {
  const { userId, date } = req.params;

  if (!userId || !date) return res.status(400).json({ error: "Paramètres manquants" });

  try {
    const query = `
      SELECT status, EXTRACT(EPOCH FROM (end_time - start_time))::int AS duree_sec
      FROM session_agents
      WHERE user_id = $1
        AND DATE(start_time) = $2
    `;
    const { rows } = await db.query(query, [userId, date]);

    // Transformer en objet { Disponible: xx, 'Pausette 1': yy, ... }
    const cumul_statuts = {};
    rows.forEach(r => {
      cumul_statuts[r.status] = (cumul_statuts[r.status] || 0) + r.duree_sec;
    });

    res.json({ userId, date, cumul_statuts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération session brute" });
  }
};


exports.getSessionDetailsForCorrection = async (req, res) => {
  try {
    const { userId, date } = req.params;

    if (!userId || !date) {
      return res.status(400).json({ error: "userId ou date manquant" });
    }

    const query = `
      SELECT 
        status,
        EXTRACT(EPOCH FROM (end_time - start_time))::int AS sec
      FROM session_agents
      WHERE user_id = $1
        AND DATE(start_time) = $2
    `;

    const { rows } = await db.query(query, [userId, date]);

    // Construire un objet cumul
    const cumul_statuts = {};
    rows.forEach(r => {
      cumul_statuts[r.status] = (cumul_statuts[r.status] || 0) + r.sec;
    });

    res.json({ userId, date, cumul_statuts });

  } catch (err) {
    console.error("Erreur getSessionDetailsForCorrection:", err);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};