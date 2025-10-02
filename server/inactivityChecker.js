// inactivityChecker.js
const db = require('./db');

const INACTIVITY_THRESHOLD_MS = 60_000; // 70s → pause auto
// const LONG_INACTIVITY_MS = 30 * 60_000; // 30 min → déconnexion totale
const LONG_INACTIVITY_MS = 70_000; // 30 min → déconnexion totale

async function checkInactiveAgents() {
  try {
    const now = new Date();
    const shortThreshold = new Date(now - INACTIVITY_THRESHOLD_MS);
    const longThreshold = new Date(now - LONG_INACTIVITY_MS);

    // 🔹 Niveau 1 : Disponible → pause inactif (après 70s)
    const activeAvailable = await db.query(`
      SELECT id, user_id 
      FROM session_agents 
      WHERE status = 'Disponible' 
        AND end_time IS NULL 
        AND last_ping < $1
    `, [shortThreshold]);

    for (const row of activeAvailable.rows) {
      console.log(`[AUTO-PAUSE] Agent ${row.user_id} → En ligne`);
      
      // Clôturer "Disponible"
      await db.query(`
        UPDATE session_agents 
        SET end_time = NOW(), 
            duration = EXTRACT(EPOCH FROM (NOW() - start_time))::INT
        WHERE id = $1
      `, [row.id]);

      // Ouvrir "pause inactif"
      await db.query(`
        INSERT INTO session_agents (user_id, status, start_time, last_ping)
        VALUES ($1, 'En ligne', NOW(), NOW())
      `, [row.user_id]);
    }

    // 🔹 Niveau 2 : pause inactif > 30 min → déconnexion totale
    const longInactive = await db.query(`
      SELECT DISTINCT user_id
      FROM session_agents
      WHERE status = 'En ligne'
        AND end_time IS NULL
        AND start_time < $1
    `, [longThreshold]);

    for (const row of longInactive.rows) {
      const userId = row.user_id;
      console.log(`[AUTO-DÉCONNEXION] Agent ${userId} inactif > 30 min`);

      // 1. Clôturer toute session active
      await db.query(`
        UPDATE session_agents
        SET end_time = NOW(),
            duration = EXTRACT(EPOCH FROM (NOW() - start_time))::INT
        WHERE user_id = $1 AND end_time IS NULL
      `, [userId]);

      // 2. Marquer comme déconnecté → crucial pour /validate
      await db.query(`
        UPDATE users 
        SET is_connected = FALSE, session_closed = TRUE 
        WHERE id = $1
      `, [userId]);

      // 3. Historique (optionnel)
      await db.query(
        "INSERT INTO agent_connections_history (user_id, event_type) VALUES ($1, 'auto_disconnect')",
        [userId]
      );
    }
  } catch (err) {
    console.error('Inactivity checker error:', err);
  }
}

setInterval(checkInactiveAgents, 30_000);
module.exports = { checkInactiveAgents };