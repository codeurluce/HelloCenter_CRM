// src/socket.js
import { io } from 'socket.io-client';

const socket = io('/', {
  withCredentials: true,
  transports: ["websocket"],
  autoConnect: false,       //  ne se connecte pas tout seul
  reconnection: false,      //  n’essaie pas de se reconnecter
});

export default socket;