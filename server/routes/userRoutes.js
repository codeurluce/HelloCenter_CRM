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
} = require("../controllers/userControllers");

/**
 * AUTHENTIFICATION & COMPTE
 */

// Créer un utilisateur avec mot de passe temporaire (généré automatiquement)
router.post("/register", createUser);

// Connexion utilisateur
router.post("/login", loginUser);

// Changer mot de passe au premier login
router.post("/change-password-first-login", verifyToken, changePasswordFirstLogin);

// Infos du profil connecté
router.get("/me", verifyToken, getMe);


/**
 * GESTION DES UTILISATEURS (ADMIN)
 */

// Récupérer tous les utilisateurs
router.get("/users", verifyToken, getAllUsers);

// Activer / désactiver un utilisateur
router.put("/:id/toggle-active", verifyToken, toggleActiveUser);

// Mettre à jour un utilisateur
router.put("/:id/update", verifyToken, updateUser);

// Réinitialiser le mot de passe (admin uniquement)
router.post("/:id/reset-password", verifyToken, resetPasswordByAdmin);

module.exports = router;
