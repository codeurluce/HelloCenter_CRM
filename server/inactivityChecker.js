// inactivityChecker.js
const db = require('./db');

const INACTIVITY_THRESHOLD_MS = 60_000; // 60s d'inactivité en "Disponible"

async function checkInactiveAgents() {
  try {
    const now = new Date();
    const threshold = new Date(now - INACTIVITY_THRESHOLD_MS);

    // 🔹 Agents "Disponible" inactifs depuis plus de 60s
    const activeAvailable = await db.query(`
      SELECT id, user_id 
      FROM session_agents 
      WHERE status = 'Disponible' 
        AND end_time IS NULL 
        AND last_ping < $1
    `, [threshold]);

    for (const row of activeAvailable.rows) {
      const { id, user_id: userId } = row;
      console.log(`[AUTO-ABSENCE] Agent ${userId} → Hors ligne (inactivité)`);

      // 1️. Clôturer la session "Disponible"
      await db.query(`
        UPDATE session_agents 
        SET end_time = NOW(), 
            duration = EXTRACT(EPOCH FROM (NOW() - start_time))::INT
        WHERE id = $1
      `, [id]); 

      // 2️. Mettre à jour l'utilisateur comme "hors ligne"
      await db.query(`
        UPDATE users 
        SET is_connected = FALSE, session_closed = TRUE 
        WHERE id = $1
      `, [userId]);

      // 3️. Historiser l’événement d’auto-déconnexion
      await db.query(`
        INSERT INTO agent_connections_history (user_id, event_type, event_time)
        VALUES ($1, 'auto_disconnect', NOW())
      `, [userId]);
    }

  } catch (err) {
    console.error('Inactivity checker error:', err);
  }
}

setInterval(checkInactiveAgents, 30_000); // Vérifie toutes les 30s
module.exports = { checkInactiveAgents };