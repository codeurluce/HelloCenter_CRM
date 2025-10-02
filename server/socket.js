// initSockets.js
const db = require('./db');
const { Server } = require("socket.io");
const { closeSessionForce } = require("./controllers/sessionControllers");

function initSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000', 'https://crmhellocenterfrontend-production.up.railway.app'],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ['websocket'],
  });

  const userSockets = new Map();

  io.use((socket, next) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId) return next(new Error("userId manquant"));
    socket.userId = userId;
    next();
  });

  async function forceDisconnectSocket(userId, reason = "Déconnexion forcée") {
    try {
      await closeSessionForce(userId);
      await db.query("UPDATE users SET session_closed = TRUE WHERE id = $1", [userId]);
      io.to(`agent_${userId}`).emit("session_closed_force", { reason });

      userSockets.get(userId)?.forEach(socketId => {
        io.sockets.sockets.get(socketId)?.disconnect(true);
      });

      userSockets.delete(userId);
      console.log(`[BACK] ⚡ Agent ${userId} déconnecté`);
    } catch (err) {
      console.error(`[BACK] ❌ Erreur forceDisconnectSocket ${userId}:`, err);
    }
  }

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    console.log(`🔌 Connecté : ${socket.id} (user ${userId})`);

    await db.query("UPDATE users SET session_closed = FALSE WHERE id = $1", [userId]);

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);
    socket.join(`agent_${userId}`);

    // socket.on("agent_disconnected", () => {
    //   console.log(`[BACK] agent_disconnected reçu pour ${userId}`);
    //   forceDisconnectSocket(userId, "Déconnexion volontaire");
    // });

    socket.on("disconnect", () => {
      console.log(`[BACK] ❌ Déconnecté : ${socket.id} (user ${userId})`);
      const set = userSockets.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          userSockets.delete(userId);
        }
      }
    });
  });

  return io;
}

module.exports = initSockets;