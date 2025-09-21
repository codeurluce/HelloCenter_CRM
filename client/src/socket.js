// src/socket.js
import { io } from 'socket.io-client';

// 🔗 adapte à ton backend (si tu déploies en prod mets ton vrai domaine)
const socket = io("http://localhost:5000", {
  // const socket = io("http://localhost:5000", {
  withCredentials: true,
  transports: ["websocket"],
});

export default socket;