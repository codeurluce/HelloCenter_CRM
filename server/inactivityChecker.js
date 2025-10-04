// inactivityChecker.js
const db = require('./db');

const INACTIVITY_THRESHOLD_MS = 60_000; // 60s d'inactivité en "Disponible"

async function checkInactiveAgents() {
  try {
    const now = new Date();
    const threshold = new Date(now - INACTIVITY_THRESHOLD_MS);

    // 🔹 Seulement : Disponible → Aucun statut (après 60s)
    const activeAvailable = await db.query(`
      SELECT id, user_id 
      FROM session_agents 
      WHERE status = 'Disponible' 
        AND end_time IS NULL 
        AND last_ping < $1
    `, [threshold]);

    for (const row of activeAvailable.rows) {
        const { id, user_id: userId } = row;
      console.log(`[AUTO-ABSENCE] Agent ${row.user_id} → Aucun statut`);
      
      // Clôturer "Disponible"
      await db.query(`
        UPDATE session_agents 
        SET end_time = NOW(), 
            duration = EXTRACT(EPOCH FROM (NOW() - start_time))::INT
        WHERE id = $1
      `, [row.id]);

      // 1 Ouvrir "Aucun statut" → durée indéfinie
      await db.query(`
        INSERT INTO session_agents (user_id, status, start_time, last_ping)
        VALUES ($1, 'Aucun statut', NOW(), NOW())
      `, [row.user_id]);

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
    // 🔸 PAS DE DÉCONNEXION AUTOMATIQUE ici
    // La session "Aucun statut" reste ouverte jusqu'au retour de l'agent

  } catch (err) {
    console.error('Inactivity checker error:', err);
  }
}

setInterval(checkInactiveAgents, 30_000); // Vérifie toutes les 30s
module.exports = { checkInactiveAgents };