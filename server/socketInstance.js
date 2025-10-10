// socketInstance.js
let io;

module.exports = {
  setIo: (ioInstance) => {
    io = ioInstance;
  },
  getIo: () => {
    if (!io) throw new Error("Socket.IO n'est pas encore initialisé !");
    return io;
  },
};

//  c'est pour récupérer l'instance io dans d'autres fichiers, ex controllers
//  il a ete utilise dans le fichier sessionControllers.js pour émettre des événements socket après un changement force de statut d'agent