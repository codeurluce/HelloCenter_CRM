// sockets.js
const { closeSessionForce, getLastAgentStatus } = require('./controllers/sessionControllers');

let activeSockets = {};
let lastPing = {}; // stocke le timestamp du dernier ping reçu par userId


function initSockets(io) {
  io.on('connection', (socket) => {
    console.log("🔌 Agent connecté:", socket.id);

     // Quand l'agent se connecte
    socket.on('agent_connected', async ({ userId }) => {
      socket.userId = userId;

      if (!activeSockets[userId]) activeSockets[userId] = [];
      activeSockets[userId].push(socket.id);

      // Initialise lastPing pour cet agent
      lastPing[userId] = Date.now();

      console.log(`✅ Agent ${userId} lié au socket ${socket.id}`);

      const lastStatus = await getLastAgentStatus(userId);
      socket.emit("restore_status", { status: lastStatus || 'En_ligne' });
    });

    // Heartbeat ping reçu du client
    socket.on('heartbeat', () => {
      if (!socket.userId) return;
      lastPing[socket.userId] = Date.now();
      // console.log(`Heartbeat reçu de l'agent ${socket.userId}`);
    });

    // Quand le socket se déconnecte
    socket.on('disconnect', async () => {
      if (!socket.userId) return;
      const { userId } = socket;

      // Retirer ce socket de la liste
      activeSockets[userId] = activeSockets[userId]?.filter(id => id !== socket.id) || [];

      // délai avant de clôturer → pour couvrir le cas d’un refresh
      setTimeout(async () => {
        if (activeSockets[userId]?.length === 0) {
          console.log(`🔴 Aucun socket restant pour l’agent ${userId}, fermeture session...`);
          await closeSessionForce(userId);
          delete lastPing[userId];
          delete activeSockets[userId];
        } else {
          console.log(`⚠️ Agent ${userId} a encore ${activeSockets[userId].length} socket(s) actif(s), session maintenue.`);
        }
      }, 10000); // délai ajustable
    });
  });

   // Intervalle serveur qui vérifie les heartbeats
  setInterval(async () => {
    const now = Date.now();

    for (const userId in lastPing) {
      // Récupère le dernier statut en BD pour cet agent
      const userStatus = await getLastAgentStatus(userId);

      // On ne ferme la session que si l’agent est "Disponible / En ligne"
      if (userStatus === 'En_ligne' || userStatus === 'Disponible') {
        const timeoutMs = 3 * 60 * 1000; // 3 minutes d'inactivité tolérée

        if (now - lastPing[userId] > timeoutMs) {
          if ((activeSockets[userId]?.length ?? 0) > 0) {
            console.log(`🔴 Agent ${userId} (${userStatus}) inactif depuis +3min, fermeture session forcée...`);
            await closeSessionForce(userId);
            // Suppression des sockets et ping correspondants
            delete lastPing[userId];
            delete activeSockets[userId];
          }
        }
      }
    }
  }, 60 * 1000); // toutes les 1 minute
}

module.exports = initSockets;