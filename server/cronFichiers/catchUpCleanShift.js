// scripts/catchUpCleanShift.js
const db = require("../db");
const { cronCleanShift } = require("./cronCleanShift");

/**
 * Vérifie les N derniers jours et exécute cleanDailyShift
 * pour les jours où des sessions dépassent 18h ou sont orphelines.
 */
async function catchUpCleanShift(daysToCheck = 3) {
  try {
    for (let i = 1; i <= daysToCheck; i++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const { rows } = await db.query(`
        SELECT 1 FROM session_agents
        WHERE start_time::date = $1
          AND (end_time > ($1::date + INTERVAL '18 hours') OR end_time IS NULL)
        LIMIT 1
      `, [dateStr]);

      if (rows.length > 0) {
        console.log(`🔁 [RATTRAPAGE] Nettoyage manquant pour ${dateStr} → exécution de cleanDailyShift`);
        await cleanDailyShift({ startDate: dateStr, endDate: dateStr });
      }
    }
    console.log("✅ Rattrapage cleanShift terminé.");
  } catch (err) {
    console.error("❌ Erreur dans catchUpCleanShift:", err);
    throw err;
  }
}

// Permet l'exécution directe : node scripts/catchUpCleanShift.js
if (require.main === module) {
  catchUpCleanShift(3)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { catchUpCleanShift };