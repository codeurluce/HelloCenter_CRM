// sockets.js
const { closeSessionForce } = require('./controllers/sessionControllers');

function initSockets(io) {
  io.on('connection', (socket) => {
    console.log("🔌 Agent connecté:", socket.id);

    // Quand l'agent s’identifie
    socket.on('agent_connected', ({ userId }) => {
      socket.userId = userId;
      console.log(`✅ Agent ${userId} lié au socket ${socket.id}`);
    });

    // Quand l’agent se déconnecte (fermeture du navigateur, perte réseau, logout, etc.)
    socket.on('disconnect', async () => {
      if (socket.userId) {
        try {
          await closeSessionForce(socket.userId); // ferme proprement la session
          console.log(`🔴 Agent ${socket.userId} déconnecté, session clôturée`);
        } catch (err) {
          console.error("❌ Erreur fermeture de session forcée:", err.message);
        }
      }
    });
  });
}

module.exports = initSockets;
