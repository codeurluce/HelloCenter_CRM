// server/server.js
require('dotenv').config();
const db = require('./db'); // ou le chemin vers ton module db

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ message: 'DB connected', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ message: 'DB connection error', error: error.message });
  }
});

const authRoutes = require('./routes/userRoutes');
app.use('/api', authRoutes);

// Route de test
app.get('/', (req, res) => {
  res.send('API CRM en ligne ✅');
});

// Socket.io (chat + statut live à venir)
io.on('connection', (socket) => {
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