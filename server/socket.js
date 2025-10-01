const db = require('./db');
const { Server } = require("socket.io");
const { closeSessionForce } = require("./controllers/sessionControllers");

const INACTIVITY_TIMEOUT_MS = 60_000;
const CHECK_INTERVAL_MS = 5_000;

function initSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000', 'https://crmhellocenterfrontend-production.up.railway.app'],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ['websocket'],
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  const userSockets = new Map();
  const lastPingMap = new Map();

  io.use((socket, next) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId) return next(new Error("Authentication error: userId manquant"));
    socket.userId = userId;
    next();
  });

  async function forceDisconnectSocket(userId, reason = "Déconnexion forcée / inactivité") {
    try {
      const res = await db.query("SELECT is_connected FROM users WHERE id = $1", [userId]);
      if (!res.rows[0]?.is_connected) {
        console.log(`[BACK] ⚡ Agent ${userId} n'est pas connecté, pas de closeSessionForce`);
        return;
      }

      await closeSessionForce(userId);
      await db.query("UPDATE users SET session_closed = TRUE WHERE id = $1", [userId]);
      io.to(`agent_${userId}`).emit("session_closed_force", { reason });

      userSockets.get(userId)?.forEach(socketId => {
        io.sockets.sockets.get(socketId)?.disconnect(true);
      });

      userSockets.delete(userId);
      lastPingMap.delete(userId);

      console.log(`[BACK] ⚡ Agent ${userId} déconnecté et session clôturée`);
    } catch (err) {
      console.error(`[BACK] ❌ Erreur forceDisconnectSocket userId=${userId}:`, err);
    }
  }

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    console.log(`🔌 Nouveau client connecté : socketId=${socket.id} userId=${userId}`);

    // Reset session_closed flag immediately on connect
    await db.query("UPDATE users SET session_closed = FALSE WHERE id = $1", [userId]);

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);
    socket.join(`agent_${userId}`);
    lastPingMap.set(userId, Date.now());

    // Do NOT emit session_closed_force if session_closed now FALSE

    socket.onAny((event, ...args) => {
      console.log(`📩 [BACK RECU] event=${event}`, args);
    });

    socket.on("heartbeat", () => {
      lastPingMap.set(userId, Date.now());
      console.log(`❤️ Heartbeat reçu userId=${userId} socketId=${socket.id}`);
    });

    socket.on("disconnect", () => {
      console.log(`[BACK] ❌ Déconnexion socketId=${socket.id} userId=${userId}`);
      const socketsSet = userSockets.get(userId);
      if (socketsSet) {
        socketsSet.delete(socket.id);
        if (socketsSet.size === 0) {
          console.log(`[BACK] ⚠️ Aucun socket restant pour userId=${userId}`);
          // rely on inactivity timer for force disconnection
        }
      }
    });
  });

  setInterval(() => {
    const now = Date.now();
    for (const [userId, lastPing] of lastPingMap.entries()) {
      const socketsSet = userSockets.get(userId);
      if ((!socketsSet || socketsSet.size === 0) && now - lastPing > INACTIVITY_TIMEOUT_MS) {
        console.log(`[BACK] ⚠️ Inactivité détectée userId=${userId}`);
        forceDisconnectSocket(userId, "Déconnexion pour inactivité");
      }
    }
  }, CHECK_INTERVAL_MS);

  return io;
}

module.exports = initSockets;