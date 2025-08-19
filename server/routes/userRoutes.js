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

// Création d'utilisateur (mot de passe généré automatiquement)
router.post("/register", createUser);

// Connexion utilisateur
router.post("/login", loginUser);

// 👉 Routes protégées par token
router.use(verifyToken);

// Changer mot de passe au premier login
router.post("/change-password-first-login", changePasswordFirstLogin);

// Infos du profil connecté
router.get("/me", getMe);


/**
 * GESTION DES UTILISATEURS (ADMIN)
 */

// Récupérer tous les utilisateurs
router.get("/users", getAllUsers);

// Activer / désactiver un utilisateur
router.put("/:id/toggle-active", toggleActiveUser);

// Mettre à jour un utilisateur
router.put("/:id/update", updateUser);

// Réinitialiser le mot de passe (admin uniquement)
router.post("/:id/reset-password", resetPasswordByAdmin);

module.exports = router;
