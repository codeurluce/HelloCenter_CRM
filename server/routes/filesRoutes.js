const express = require('express');
const router = express.Router();
const db = require('../db'); // Connexion PostgreSQL
const fichesControllers = require('../controllers/fichesControllers');


// Récupérer toutes les fiches de la base de données
// GET /api/files
router.put('/:id/traiter', fichesControllers.traiterFiche); // Pour prendre en charge une fiche
console.log("Route PUT /:id/traiter initialisée");

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM files ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des fiches :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
