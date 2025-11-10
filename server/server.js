// if (process.env.NODE_ENV !== 'production') {
//   require('dotenv').config();
// }
require('dotenv').config(); 

console.log("🔑 Loaded ENV variables:");
console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ défini" : "❌ manquant");
console.log("PORT:", process.env.PORT);

const db = require('./db');
const express = require('express');
const cors = require('cors');
const http = require('http');
const cron = require('node-cron');
const { checkContrats } = require("./controllers/rhControllers");

require ('./inactivityChecker')
const sessionRoutes = require('./routes/sessionRoutes');
const salesRoutes = require('./routes/salesRoutes');
const filesRoutes = require('./routes/filesRoutes');
const historiquesfilesRoutes = require('./routes/historiquesfilesRoutes');
const historiquesVentesRoutes = require('./routes/historiquesVentesRoutes');
const userRoutes = require('./routes/userRoutes');
const rhRoutes = require('./routes/rhRoutes')
const initSockets = require('./socket');
const { splitSessionsAtMidnight } = require('./controllers/sessionControllers');

const app = express();
const server = http.createServer(app);

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
app.use('/api/rh', rhRoutes);

// Routes de santé
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ message: 'DB connected', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ message: 'DB connection error', error: error.message });
  }
});

app.get('/health', (req, res) => res.status(200).json({ status: 'OK', uptime: process.uptime() }));
app.get('/', (req, res) => res.send('API CRM en ligne ✅'));

// Configuration Socket.IO
const io = initSockets(server);
const { setIo } = require("./socketInstance");
setIo(io);

// Tâche cron pour minuit
cron.schedule('0 0 * * *', async () => {
  console.log("⏰ Minuit → Split des sessions en cours...");
  await splitSessionsAtMidnight();
});

cron.schedule("* * * * *", () => {
  checkContrats();
});

// Lancer le serveur
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur HTTP + Socket.IO lancé sur le port ${PORT}`);
});

// Vérification DB au démarrage
db.query('SELECT NOW()')
  .then(res => console.log('✅ DB connected at:', res.rows[0].now))
  .catch(err => console.error('❌ DB connection error:', err));
