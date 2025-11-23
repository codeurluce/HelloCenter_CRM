// initSockets.js
const db = require('./db');
const { Server } = require("socket.io");

let io; // Socket.io global
const userSockets = new Map();

// 🔹 Initialisation de Socket.io
function initSockets(server) {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000', 'https://crm.hellocenter.org'],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ['websocket'],
  });

  io.use((socket, next) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId) return next(new Error("userId manquant"));
    socket.userId = userId;
    next();
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    console.log(`[BACK] Connecté : ${socket.id} (user ${userId})`);

    await db.query("UPDATE users SET session_closed = FALSE WHERE id = $1", [userId]);

    if (socket.handshake.auth?.role === "Admin") {
      socket.join("admins");
    }

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);
    socket.join(`agent_${userId}`);

    socket.on("disconnect", () => {
      console.log(`[BACK] ❌ Déconnecté : ${socket.id} (user ${userId})`);
      const set = userSockets.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) userSockets.delete(userId);
      }
    });
  });

  return io;
}

module.exports = { initSockets, userSockets };
