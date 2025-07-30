const express = require('express');
const router = express.Router();
const db = require('../db'); // Connexion PostgreSQL
const filesControllers = require('../controllers/filesControllers');
const auth = require('../middlewares/authMiddleware')


// Récupérer toutes les fiches
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM files ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des fiches :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Autres routes PUT ici...
router.put('/:id/traiter', filesControllers.traiterFiche);
router.put('/:id/annuler', filesControllers.annulerFiche);
router.get('/today-summary', auth, filesControllers.getTodayNewFilesByUniverse);

module.exports = router;
