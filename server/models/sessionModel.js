// models/sessionModel.js
const db = require("../db");

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

    return result.rows[0]?.status || null;
  } catch (err) {
    console.error("❌ Erreur getLastAgentStatus:", err);
    throw err; // on relance pour que le contrôleur gère
  }
};
