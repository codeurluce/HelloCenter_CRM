const express = require("express");
const router = express.Router();
const { verifyToken } = require("../controllers/userControllers");
const {
    getUsersContrat,
    updateAgentContract,
    getNotificationsFinContrat,
    markNotificationAsRead,
} = require("../controllers/rhControllers");
const auth = require("../middlewares/authMiddleware");
const siteScope = require("../middlewares/siteScope");


router.use(auth); // toutes les routes nécessitent d'être connecté
router.use(siteScope);   // toutes les routes filtrent selon la scope/site

router.get("/users-contrat", getUsersContrat); // 📌 Récupérer tous les utilisateurs et aussi leur contrat
router.get("/notifications/fin-contrat", getNotificationsFinContrat)
router.put("/:id/update-contrat", updateAgentContract)
router.patch("/notifications/:id/lu", markNotificationAsRead)

module.exports = router;