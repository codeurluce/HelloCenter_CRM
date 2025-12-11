/**
 * Nettoyage automatique des sessions agents pour respecter le shift.
 * Corrige les sessions avant SHIFT_START et après SHIFT_END.
 */


const db = require("../db");

// Paramètres du shift
const SHIFT_START = "09:00:00";
const SHIFT_END = "18:00:00";

/**
 * Nettoyage des sessions d'agents pour une date ou période donnée
 * @param {String} startDate YYYY-MM-DD
 * @param {String} endDate YYYY-MM-DD
 * @param {Array<Number>} userIds facultatif, si vide => tous les agents
 */
async function cronCleanShift({ startDate, endDate = startDate, userIds = [] }) {
    console.log("🚀 [cronCleanShift] Démarrage du nettoyage", { startDate, endDate });
  if (!startDate || !endDate) {
    throw new Error("startDate et endDate sont obligatoires");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayCount = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

  for (let i = 0; i < dayCount; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const dayStr = currentDate.toISOString().split("T")[0];
    console.log(`⏰ Nettoyage complet du shift du ${dayStr}...`);

    try {
      // 1️⃣ Filtrer par agents si fourni
      const userFilter = userIds.length ? `AND user_id = ANY($2)` : "";
      const params = userIds.length ? [dayStr, userIds] : [dayStr];

      const agentsRes = await db.query(
        `SELECT DISTINCT user_id 
         FROM session_agents 
         WHERE start_time::date = $1
         ${userFilter}`,
        params
      );

      const shiftStart = new Date(`${dayStr}T${SHIFT_START}`);
      const shiftEnd = new Date(`${dayStr}T${SHIFT_END}`);

      for (const { user_id } of agentsRes.rows) {
        const sessionsRes = await db.query(
          `SELECT id, status, start_time, end_time, duration
           FROM session_agents
           WHERE user_id = $1
             AND start_time::date = $2
           ORDER BY start_time ASC`,
          [user_id, dayStr]
        );

        const sessions = sessionsRes.rows;
        if (sessions.length === 0) continue;

        const firstSession = sessions[0];
        const lastSession = sessions[sessions.length - 1];

        for (const s of sessions) {
          let startTime = new Date(s.start_time);
          let endTime = s.end_time ? new Date(s.end_time) : null;

          // Si end_time est NULL → considère comme ongoing → fixe à shiftEnd
          if (!endTime) {
            endTime = shiftEnd;
          }

          // ✂️ Tronquer aux bornes du shift
          if (startTime < shiftStart) startTime = shiftStart;
          if (endTime > shiftEnd) endTime = shiftEnd;

          // ⏱️ Si après troncature, start >= end → aligner
          if (startTime >= endTime) {
            startTime = endTime = shiftEnd; // ou shiftStart, mais shiftEnd est plus logique pour "fin de shift"
          }

          // 🔁 Mettre à jour si changé
          const origStart = new Date(s.start_time);
          const origEnd = s.end_time ? new Date(s.end_time) : null;

          const startChanged = startTime.getTime() !== origStart.getTime();
          const endChanged = (!origEnd && endTime.getTime() !== shiftEnd.getTime()) ||
            (origEnd && endTime.getTime() !== origEnd.getTime());

          if (startChanged || endChanged) {
            await db.query(
              `UPDATE session_agents
       SET start_time = $1,
           end_time   = $2
       WHERE id = $3`,
              [startTime.toISOString(), endTime.toISOString(), s.id]
            );
          }
        }
      }
      console.log(`✅ Nettoyage du ${dayStr} terminé pour la période`, { startDate, endDate });
    } catch (err) {
      console.error(`❌ Erreur nettoyage du ${dayStr} :`, err);
    }
  }
}

module.exports = { cronCleanShift };

// ✅ Cron quotidien pour le jour courant
if (require.main === module) {
  cronCleanShift({ startDate: new Date().toISOString().split("T")[0] })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}