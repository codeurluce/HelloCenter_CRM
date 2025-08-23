// sockets.js
const { closeSessionForce } = require('./controllers/sessionControllers');

let activeSockets = {};

function initSockets(io) {
  io.on('connection', (socket) => {
    console.log("🔌 Agent connecté:", socket.id);

    socket.on('agent_connected', ({ userId }) => {
      socket.userId = userId;
      if (!activeSockets[userId]) activeSockets[userId] = [];
      activeSockets[userId].push(socket.id);
      console.log(`✅ Agent ${userId} lié au socket ${socket.id}`);
    });

    socket.on('disconnect', async () => {
      if (!socket.userId) return;
      const { userId } = socket;

      // retirer ce socket de la liste
      activeSockets[userId] = activeSockets[userId]?.filter(id => id !== socket.id) || [];

      // délai avant de clôturer → pour couvrir le cas d’un refresh
      setTimeout(async () => {
        if (activeSockets[userId]?.length === 0) {
          console.log(`🔴 Aucun socket restant pour l’agent ${userId}, fermeture session...`);
          await closeSessionForce(userId);
        } else {
          console.log(`⚠️ Agent ${userId} a encore ${activeSockets[userId].length} socket(s) actif(s), session maintenue.`);
        }
      }, 10000); // 1.5s de délai, ajustable
    });
  });
}

module.exports = initSockets;
