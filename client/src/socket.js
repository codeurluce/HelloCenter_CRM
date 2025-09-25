// src/socket.js
import { io } from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// 🔗 adapte à ton backend (si tu déploies en prod mets ton vrai domaine)
const socketUrl = BACKEND_URL || 'http://localhost:8080';

const socket = io(socketUrl, {
  withCredentials: true,
  transports: ["websocket"],
  secure: socketUrl.startsWith('https'), // true en prod, false en local
  autoConnect: false,       //  ne se connecte pas tout seul
  reconnection: false,      //  n’essaie pas de se reconnecter
});

export default socket;