// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const {
  createUser,
  deleteUserByAdmin,
  loginUser,
  // verifyToken,
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
} = require("../controllers/userControllers");
const auth = require('../middlewares/authMiddleware')
const siteScope = require('../middlewares/siteScope');

/**
 * =====================
 * ROUTES PUBLIQUES
 * =====================
 */

// Login utilisateur
router.post("/login", loginUser); // 📌 Connexion utilisateur // Méthode : POST /api/users/login

// Connexion / déconnexion agent (public, peut être automatisé par le client)
router.post('/agent/connect', connectAgent); // 📌 Connexion d’un agent (mise à jour état connecté) // Méthode : POST /api/users/agent/connect
router.post('/agent/disconnect', disconnectAgent); // 📌 Déconnexion d’un agent (mise à jour état déconnecté) // Méthode : POST /api/users/agent/disconnect
router.post('/agent/disconnect-force', disconnectAgentForce); // 📌 Déconnexion forcée d’un agent (automatisée, en cas de perte de connexion ) // Méthode : POST /api/users/agent/disconnect-force


/**
 * =====================
 * ROUTES PRIVÉES (auth + siteScope)
 * =====================
 */
router.use(auth);  // vérifie le JWT
router.use(siteScope);    // ajoute req.siteId

// Profil utilisateur
router.get("/me", getMe); // 📌 Récupérer les informations du profil connecté (authentification requise) // Méthode : GET /api/users/me
router.get('/validate', validateSession); // 📌 Validation de session (authentification requise) // Méthode : GET /api/users/validate
router.post("/change-password-first-login", changePasswordFirstLogin); // 📌 Changement du mot de passe au premier login (authentification requise) // Méthode : POST /api/users/change-password-first-login

// Gestion utilisateurs (admin)
router.post("/register", createUser); // 📌 Création d’un utilisateur avec mot de passe temporaire généré // Méthode : POST /api/users/register
router.delete("/:id/delete-users", deleteUserByAdmin);
router.get("/users", getAllUsers);// 📌 Récupérer tous les utilisateurs (authentification requise) // Méthode : GET /api/users/users
router.get("/users-bd", getAllUsersBd); // 📌 Récupérer tous les utilisateurs depuis la base (authentification nécessaire) // Méthode : GET /api/users/users_bd
router.post("/:id/reset-password", resetPasswordByAdmin); // 📌 Réinitialiser le mot de passe d’un utilisateur par son ID (admin uniquement, auth requise) // Méthode : POST /api/users/:id/reset-password
router.put("/:id/toggle-active", toggleActiveUser); // 📌 Activer ou désactiver un utilisateur par son ID (authentification requise) // Méthode : PUT /api/users/:id/toggle-active
router.put("/:id/update", updateUser); // 📌 Mettre à jour les informations d’un utilisateur par son ID (authentification requise) // Méthode : PUT /api/users/:id/update

// Déconnexion forcée d’un agent par admin
router.post('/agent/:id/disconnectByAdmin', disconnectAgentbyAdmin); // 📌 Déconnexion d’un agent par un administrateur (mise à jour état déconnecté) // Méthode : POST /api/users/agent/:id/disconnectByAdmin


module.exports = router;