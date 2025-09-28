// server/server.js
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

console.log("🔑 Loaded ENV variables:");
console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ défini" : "❌ manquant");
console.log("PORT:", process.env.PORT);

const db = require('./db');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');

// Import des routes
const sessionRoutes = require('./routes/sessionRoutes');
const salesRoutes = require('./routes/salesRoutes');
const filesRoutes = require('./routes/filesRoutes');
const historiquesfilesRoutes = require('./routes/historiquesfilesRoutes');
const historiquesVentesRoutes = require('./routes/historiquesVentesRoutes');
const userRoutes = require('./routes/userRoutes');
const initSockets = require('./socket');
const { splitSessionsAtMidnight } = require('./controllers/sessionControllers');

// Initialisation de l'application Express
const app = express();
const server = http.createServer(app);

// ✅ Configuration Socket.IO avec CORS sécurisé pour Railway
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://crmhellocenterfrontend-production.up.railway.app'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket'], // Force WebSocket only (évite le polling en prod)
   // 🔥 Heartbeat WebSocket natif (détecte la veille/perte réseau)
  pingInterval: 10000,    // 10s
  pingTimeout: 5000       // 5s de timeout → déconnexion après 15s max
});

// Initialiser les sockets
initSockets(io);

// ⏰ Tâche planifiée : tous les jours à 00:00
cron.schedule('0 0 * * *', async () => {
  console.log("⏰ Minuit → Split des sessions en cours...");
  await splitSessionsAtMidnight();
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/session_agents', sessionRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/historiques', historiquesfilesRoutes);
app.use('/api/historiques/ventes', historiquesVentesRoutes);

// Routes de santé
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ message: 'DB connected', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ message: 'DB connection error', error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.send('API CRM en ligne ✅');
});

// ✅ ✅ ✅ CORRECTION CRITIQUE : ÉCOUTER AVEC `server`, PAS `app`
const PORT = process.env.PORT || 8080; // Railway utilise 8080, pas 5000
console.log(`🚀 Port utilisé : ${PORT} (source: ${process.env.PORT ? '.env' : 'fallback'})`);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur HTTP + Socket.IO lancé sur le port ${PORT}`);
  console.log(`🌐 Écoute sur 0.0.0.0 (nécessaire pour Railway)`);
});

// Vérification de la connexion DB au démarrage
db.query('SELECT NOW()')
  .then(res => console.log('✅ DB connected at:', res.rows[0].now))
  .catch(err => console.error('❌ DB connection error:', err));