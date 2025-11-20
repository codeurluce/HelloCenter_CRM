// src/socket.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:8080', {
  withCredentials: true,
  transports: ["websocket"],
  autoConnect: false,
  reconnection: false,      //  n’essaie pas de se reconnecter
});

export default socket;