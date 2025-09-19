// server/server.js
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
// require('dotenv').config();

console.log("🔑 Loaded ENV variables:");
console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ défini" : "❌ manquant");
console.log("PORT:", process.env.PORT);


const db = require('./db');

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const PORT = process.env.PORT || 5000;
const cron = require('node-cron');

// Import des routes
const sessionRoutes = require('./routes/sessionRoutes');
const salesRoutes = require('./routes/salesRoutes');
const filesRoutes = require('./routes/filesRoutes');
const historiquesfilesRoutes = require('./routes/historiquesfilesRoutes');
const historiquesVentesRoutes = require('./routes/historiquesVentesRoutes')
const userRoutes = require('./routes/userRoutes');
const initSockets = require('./socket');
const { splitSessionsAtMidnight } = require('./controllers/sessionControllers');




// Initialisation de l'application Express
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

initSockets(io);



// ⏰ Tâche planifiée : tous les jours à 00:00
cron.schedule('0 0 * * *', async () => {
  console.log("⏰ Minuit → Split des sessions en cours...");
  await splitSessionsAtMidnight();
});

// les API d'authentification, de sessions et de ventes
app.use(cors());
app.use(express.json());
app.use('/api', userRoutes)
app.use('/api/users', userRoutes) 
app.use('/api/sales', salesRoutes); // APi pour les ventes
app.use('/api/session_agents', sessionRoutes); // API pour les sessions
app.use('/api/files', filesRoutes); // API pour les fichiers
app.use('/api/historiques', historiquesfilesRoutes); // API pour l'historique des fichiers
app.use('/api/historiques/ventes', historiquesVentesRoutes); // API pour l'historique des ventes







app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ message: 'DB connected', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ message: 'DB connection error', error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('API CRM en ligne ✅');
});

// io.on('connection', socket => {
//   console.log('Un utilisateur connecté :', socket.id);
//   socket.on('disconnect', () => {
//     console.log('Utilisateur déconnecté :', socket.id);
//   });
// });

// server.listen(PORT, () => {
//   console.log(`🚀 Serveur CRM lancé sur http://localhost:${PORT}`);
// });
app.listen(PORT, () => {
  console.log(`🚀 Serveur CRM lancé sur le port ${PORT}`);
});

db.query('SELECT NOW()')
  .then(res => console.log('DB connected at:', res.rows[0].now))
  .catch(err => console.error('DB connection error:', err));