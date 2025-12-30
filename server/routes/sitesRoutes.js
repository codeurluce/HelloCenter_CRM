const express = require("express");
const router = express.Router();
const sitesController = require("../controllers/sitesControllers");
const auth = require("../middlewares/authMiddleware");

router.use(auth);

// Liste des sites (SuperAdmin uniquement)
router.get("/", auth, sitesController.getAllSites);

module.exports = router;
