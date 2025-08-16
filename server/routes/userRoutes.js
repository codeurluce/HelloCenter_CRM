// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  createUser,
  createAgent,
  loginUser,
  verifyToken,
  getMe,
  getAllUsers,
} = require('../controllers/userControllers');

// Créer un agent (avec email + mot de passe fournis)
router.post('/create-agent', createAgent);

// Créer un utilisateur avec email généré
router.post('/register', createUser);

// Connexion
router.post('/login', loginUser);

// Infos de l'utilisateur connecté
router.get('/me', verifyToken, getMe);

// Récupérer tous les utilisateurs (admin)
router.get('/users', verifyToken, getAllUsers);

module.exports = router;
