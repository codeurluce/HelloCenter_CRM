// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const {
  createUser,
  loginUser,
  verifyToken,
  getMe,
  getAllUsers,
  changePasswordFirstLogin,
  toggleActiveUser,
  updateUser,
  resetPasswordByAdmin,
  connectAgent,
  disconnectAgent,
  getAllUsersBd,
  disconnectAgentForce,
  validateSession,
  disconnectAgentbyAdmin,
  getUsersContrat
} = require("../controllers/userControllers");

/**
 * AUTHENTIFICATION & COMPTE UTILISATEUR
 */

router.get("/me", verifyToken, getMe); // 📌 Récupérer les informations du profil connecté (authentification requise) // Méthode : GET /api/users/me
router.get('/validate', verifyToken, validateSession); // 📌 Validation de session (authentification requise) // Méthode : GET /api/users/validate

router.post("/register", createUser); // 📌 Création d’un utilisateur avec mot de passe temporaire généré // Méthode : POST /api/users/register
router.post("/login", loginUser); // 📌 Connexion utilisateur // Méthode : POST /api/users/login
router.post('/agent/connect', connectAgent); // 📌 Connexion d’un agent (mise à jour état connecté) // Méthode : POST /api/users/agent/connect
router.post('/agent/disconnect', disconnectAgent); // 📌 Déconnexion d’un agent (mise à jour état déconnecté) // Méthode : POST /api/users/agent/disconnect
router.post('/agent/disconnect-force', disconnectAgentForce); // 📌 Déconnexion forcée d’un agent (automatisée, en cas de perte de connexion ) // Méthode : POST /api/users/agent/disconnect-force
router.post('/agent/:id/disconnectByAdmin', verifyToken, disconnectAgentbyAdmin); // 📌 Déconnexion d’un agent par un administrateur (mise à jour état déconnecté) // Méthode : POST /api/users/agent/:id/disconnectByAdmin
router.post("/change-password-first-login", verifyToken, changePasswordFirstLogin); // 📌 Changement du mot de passe au premier login (authentification requise) // Méthode : POST /api/users/change-password-first-login


/**
 * GESTION DES UTILISATEURS (ADMIN)
 */

/**
 * GESTION DES UTILISATEURS (ADMINISTRATION)
 */

router.get("/users", verifyToken, getAllUsers);// 📌 Récupérer tous les utilisateurs (authentification requise) // Méthode : GET /api/users/users
router.get("/users-bd", verifyToken, getAllUsersBd); // 📌 Récupérer tous les utilisateurs depuis la base (authentification nécessaire) // Méthode : GET /api/users/users_bd
router.get("/users-contrat", verifyToken, getUsersContrat); // 📌 Récupérer tous les utilisateurs et aussi leur contrat

router.post("/:id/reset-password", verifyToken, resetPasswordByAdmin); // 📌 Réinitialiser le mot de passe d’un utilisateur par son ID (admin uniquement, auth requise) // Méthode : POST /api/users/:id/reset-password

router.put("/:id/toggle-active", verifyToken, toggleActiveUser); // 📌 Activer ou désactiver un utilisateur par son ID (authentification requise) // Méthode : PUT /api/users/:id/toggle-active
router.put("/:id/update", verifyToken, updateUser); // 📌 Mettre à jour les informations d’un utilisateur par son ID (authentification requise) // Méthode : PUT /api/users/:id/update

module.exports = router;