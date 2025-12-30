const express = require("express");
const router = express.Router();
const sitesController = require("../controllers/sitesControllers");
const auth = require("../middlewares/authMiddleware");

router.use(auth);

// Liste des sites (SuperAdmin uniquement)
router.get("/", auth, sitesController.getAllSites);
router.post("/", auth, sitesController.createSites);
router.put("/:id", auth, sitesController.updateSites);
router.delete("/:id", auth, sitesController.deleteSites);

module.exports = router;
