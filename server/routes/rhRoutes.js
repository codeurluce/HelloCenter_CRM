const express = require("express");
const router = express.Router();
const { verifyToken } = require("../controllers/userControllers");
const { 
    getUsersContrat, 
    updateAgentContract 
} = require("../controllers/rhControllers")


router.get("/users-contrat", verifyToken, getUsersContrat); // 📌 Récupérer tous les utilisateurs et aussi leur contrat
router.put("/:id/update-contrat", verifyToken, updateAgentContract)

module.exports = router;