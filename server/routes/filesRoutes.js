const express = require('express');
const router = express.Router();
const db = require('../db'); // Connexion PostgreSQL
const filesControllers = require('../controllers/filesControllers');
const auth = require('../middlewares/authMiddleware')


// Récupérer toutes les fiches
router.get('/', async (req, res) => { // => GET    /api/files
  try {
    const result = await db.query('SELECT * FROM files ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des fiches :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Point d’entrée logique : /api/files

router.put('/:id/traiter', filesControllers.traiterFiche); // => PUT    /api/files/:id/traiter
router.put('/:id/annuler', filesControllers.annulerFiche); // => PUT    /api/files/:id/annuler
router.put('/:id/cloturer', filesControllers.cloturerFiche); // => PUT    /api/files/:id/cloturer
router.put('/:id/programmer-rdv', filesControllers.programRdv, filesControllers.getFilesToRDV); // => PUT    /api/files/:id/programmer-rdv
router.get('/rendezvous/upcoming/:agentId', filesControllers.getUpcomingRendezVous);
router.get('/today-summary', auth, filesControllers.getTodayNewFilesByUniverse);

module.exports = router;
