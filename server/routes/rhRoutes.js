const express = require("express");
const router = express.Router();
const { verifyToken } = require("../controllers/userControllers");
const {
    getUsersContrat,
    updateAgentContract,
    getNotificationsFinContrat,
    markNotificationAsRead,
} = require("../controllers/rhControllers")


router.get("/users-contrat", verifyToken, getUsersContrat); // 📌 Récupérer tous les utilisateurs et aussi leur contrat
router.get("/notifications/fin-contrat", verifyToken, getNotificationsFinContrat)
router.put("/:id/update-contrat", verifyToken, updateAgentContract)
router.patch("/notifications/:id/lu", verifyToken, markNotificationAsRead)


module.exports = router;