/**
 * Nettoyage automatique des sessions agents pour respecter le shift.
 * Corrige les sessions avant SHIFT_START et après SHIFT_END.
 */

const db = require("./db");

// Paramètres du shift
const SHIFT_START = "09:00:00";
const SHIFT_END = "18:00:00";

/**
 * Nettoyage quotidien des sessions d'agents
 */
async function cleanDailyShift() {
  const today = new Date().toISOString().split("T")[0];
  console.log(`⏰ Nettoyage complet du shift du ${today}...`);

  try {
    // 1️⃣ Récupérer tous les agents avec sessions aujourd'hui
    const agentsRes = await db.query(
      `SELECT DISTINCT user_id 
       FROM session_agents 
       WHERE start_time::date = $1`,
      [today]
    );

    const shiftStart = new Date(`${today}T${SHIFT_START}`);
    const shiftEnd = new Date(`${today}T${SHIFT_END}`);

    for (const { user_id } of agentsRes.rows) {
      // 2️⃣ Récupérer toutes les sessions du jour
      const sessionsRes = await db.query(
        `SELECT id, status, start_time, end_time, duration
         FROM session_agents
         WHERE user_id = $1
           AND start_time::date = $2
         ORDER BY start_time ASC`,
        [user_id, today]
      );

      const sessions = sessionsRes.rows;
      if (sessions.length === 0) continue;

      const firstSession = sessions[0];
      const lastSession = sessions[sessions.length - 1];

      for (const s of sessions) {
        let start = new Date(s.start_time);
        let end = new Date(s.end_time);
        // let newDuration = Math.floor((end - start) / 1000);

        // ------------------------------
        // 1️⃣ Premier statut → corriger start_time si avant shift
        // ------------------------------
        if (s.id === firstSession.id && start < shiftStart) {
          start = shiftStart;
          // newDuration = Math.floor((end - start) / 1000);
        }

        // ------------------------------
        // 2️⃣ Dernier statut → corriger end_time si après shift
        // ------------------------------
        if (s.id === lastSession.id && end > shiftEnd) {
          end = shiftEnd;
          // newDuration = Math.floor((end - start) / 1000);
        }

        // ------------------------------
        // 3️⃣ Statuts entièrement hors shift → duration = 0
        // ------------------------------
        if ((s.id !== firstSession.id && s.id !== lastSession.id) &&
          (end <= shiftStart || start >= shiftEnd)) {
          start = end = start >= shiftEnd ? shiftEnd : shiftStart;
          // newDuration = 0;
        }

        // ------------------------------
        // 4️⃣ Session avec start >= end → duration = 0
        // ------------------------------
        if (start >= end) {
          // newDuration = 0;
          start = end = start >= shiftEnd ? shiftEnd : shiftStart;
        }

        // ------------------------------
        // 5️⃣ Mise à jour en base si nécessaire
        // ------------------------------
        if (
          start.getTime() !== new Date(s.start_time).getTime() ||
          end.getTime() !== new Date(s.end_time).getTime()
          // newDuration !== s.duration
        ) {
          await db.query(
            `UPDATE session_agents
              SET start_time = $1,
                  end_time   = $2
              WHERE id = $3`,
            [start.toISOString(), end.toISOString(), s.id]
          );
        }
      }
    }

    console.log("✅ Nettoyage shift terminé !");
  } catch (err) {
    console.error("❌ Erreur nettoyage shift :", err);
  }
}

module.exports = { cleanDailyShift };

if (require.main === module) {
  cleanDailyShift().then(() => process.exit(0));
}