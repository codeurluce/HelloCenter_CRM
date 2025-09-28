const db = require('./db');
const { closeSessionForce, getLastAgentStatus } = require('./controllers/sessionControllers');

let activeSockets = {};
let lastPing = {};

const INACTIVITY_TIMEOUT_MS = 2.5 * 60 * 1000;

function initSockets(io) {
  io.on('connection', (socket) => {
    console.log("🟢 Nouveau socket connecté:", socket.id);

    socket.on('agent_connected', async ({ userId }) => {
      console.log("🔌 SOCKET CONNECTÉ - userId:", userId);
      socket.userId = userId;
      if (!activeSockets[userId]) activeSockets[userId] = [];
      activeSockets[userId].push(socket.id);
      lastPing[userId] = Date.now();

      let lastStatus = await getLastAgentStatus(userId);
      console.log("📊 Dernier statut trouvé:", lastStatus);

      socket.emit("restore_status", { status: lastStatus || "En ligne" });
    });

socket.on('heartbeat', async () => {
  if (!socket.userId) return;
  lastPing[socket.userId] = Date.now();
  console.log(`[SOCKET] heartbeat from ${socket.userId}`);

  // Optionnel / recommandé : update DB last_ping
  try {
    await db.query(
      `UPDATE session_agents SET last_ping = NOW() WHERE user_id = $1 AND end_time IS NULL`,
      [socket.userId]
    );
  } catch (err) { console.error('db update last_ping failed', err); }
});

    socket.on('disconnect', async () => {
      if (!socket.userId) return;
      const { userId } = socket;
      console.log("🔌 SOCKET DÉCONNECTÉ - userId:", userId);

      activeSockets[userId] = activeSockets[userId]?.filter(id => id !== socket.id) || [];
      console.log(`[DEBUG] Sockets restants pour ${userId}: ${activeSockets[userId].length}`);

      if (activeSockets[userId]?.length === 0) {
        console.log(`🔴 Fermeture session immédiate pour ${userId}`);
        await closeSessionForce(userId);
        delete lastPing[userId];
        delete activeSockets[userId];
      }
    });
  });

  // --- 🔹 Vérification inactivité toutes les 30s
setInterval(async () => {
  const cutoff = new Date(Date.now() - INACTIVITY_TIMEOUT_MS);
  // selectionne sessions ouvertes avant cutoff et status = 'Disponible' (ou la règle que tu veux)
  const stale = await db.query(
    `SELECT id, user_id, start_time, last_ping FROM session_agents
     WHERE end_time IS NULL AND last_ping < $1`,
    [cutoff]
  );

  for (const row of stale.rows) {
    console.log(`[SERVER] closing stale session id=${row.id} user=${row.user_id} last_ping=${row.last_ping}`);
    await db.query(
      `UPDATE session_agents
       SET end_time = $1,
           duration = EXTRACT(EPOCH FROM ($1 - start_time))::INT
       WHERE id = $2`,
      [row.last_ping || new Date(), row.id] // use last_ping if you want the precise "last seen"
    );

    // notifier socket(s) connectés de cet user
    // io.to(userSocketRooms[userId])... ou comme tu fais avec activeSockets
    // io.to(socketId).emit('session_closed_force', { reason: 'inactivité' });
  }
}, 30_000);
}

module.exports = initSockets;