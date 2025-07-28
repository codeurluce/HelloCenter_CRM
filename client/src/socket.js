// src/socket.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000'); // adapte l'URL à ton backend

export default socket;
