// server/server.js
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

const authRoutes = require('./routes/authRoutes');
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
