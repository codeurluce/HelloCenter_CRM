// src/socket.js
import { io } from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const socket = io(BACKEND_URL, {
  withCredentials: true,
  transports: ["websocket"],
  secure: BACKEND_URL.startsWith('https'), // true en prod, false en local
});

export default socket;