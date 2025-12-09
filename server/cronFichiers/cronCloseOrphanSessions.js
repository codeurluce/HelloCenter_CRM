// cronCloseOrphanSessions.js
const db = require("../db");

/**
 * Ferme toutes les sessions ouvertes (end_time IS NULL)
 * dont la date de début est STRICTEMENT antérieure à aujourd'hui.
 * On fixe end_time à 23:59:59 de la date de start_time.
 */
async function cronCloseOrphanSessions() {
  const query = `
    UPDATE session_agents
    SET end_time = (start_time::date + INTERVAL '23 hours 59 minutes 59 seconds')
    WHERE end_time IS NULL
      AND start_time::date < CURRENT_DATE;
  `;

  try {
    const result = await db.query(query);
    console.log(`[close-orphan-sessions] ${result.rowCount} session(s) orpheline(s) clôturée(s).`);
    return result.rowCount;
  } catch (err) {
    console.error("[ERROR] Échec de la fermeture des sessions orphelines :", err);
    throw err;
  }
}

// Permet d'exécuter le script via `node scripts/close-orphan-sessions.js`
if (require.main === module) {
  cronCloseOrphanSessions()
    .then(() => {
      console.log("✅ Fermeture des sessions orphelines terminée.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Script échoué :", err.message);
      process.exit(1);
    });
}

module.exports = { cronCloseOrphanSessions };