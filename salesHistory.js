const db = require('./db');

async function logSaleHistory({ saleId, action, actorId, actorName, commentaire = '' }) {
  try {
    await db.query(
      `INSERT INTO sales_history
       (sale_id, action, actor_id, actor_name, commentaire, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [saleId, action, actorId, actorName, commentaire]
    );
  } catch (error) {
    console.error('Erreur logSaleHistory:', error);
  }
}

async function getActorName(req) {
  // récupère le nom complet de l’agent ou admin
  if (req.user.firstname && req.user.lastname) {
    return `${req.user.firstname} ${req.user.lastname}`;
  } else {
    const resUser = await db.query(
      `SELECT firstname, lastname FROM users WHERE id = $1`,
      [req.user.id]
    );
    const user = resUser.rows[0];
    return user ? `${user.firstname} ${user.lastname}` : `ID ${req.user.id}`;
  }
}

module.exports = { logSaleHistory, getActorName };