// server/server.js
require('dotenv').config();
const db = require('./db');

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const PORT = process.env.PORT || 5000;

// Import des routes
const sessionRoutes = require('./routes/sessionRoutes');
const authRoutes = require('./routes/userRoutes');
const salesRoutes = require('./routes/salesRoutes');
const filesRoutes = require('./routes/filesRoutes');

// Initialisation de l'application Express
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// les API d'authentification, de sessions et de ventes
app.use(cors());
app.use(express.json());
app.use('/api', authRoutes); // API pour l'authentification
app.use('/api/sales', salesRoutes); // APi pour les ventes
app.use('/api/sessions', sessionRoutes); // API pour les sessions
app.use('/api/files', filesRoutes); // API pour les fichiers


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

io.on('connection', socket => {
  console.log('Un utilisateur connecté :', socket.id);
  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté :', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Serveur CRM lancé sur http://localhost:${PORT}`);
});

db.query('SELECT NOW()')
  .then(res => console.log('DB connected at:', res.rows[0].now))
  .catch(err => console.error('DB connection error:', err));
