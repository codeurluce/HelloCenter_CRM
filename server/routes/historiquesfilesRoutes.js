const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middlewares/authMiddleware');
const siteScope = require('../middlewares/siteScope');

router.use(auth);
router.use(siteScope);

// ➕ Ajouter une entrée historique
router.post('/', async (req, res) => {

  const { fiche_id, action, actor_id, actor_name, commentaire, metadata } = req.body;
  try {
    await db.query('INSERT INTO historique_files (fiche_id, action, actor_id, actor_name, commentaire, metadata) VALUES ($1, $2, $3, $4, $5, $6)', 
      [fiche_id, action, actor_id, actor_name, commentaire, metadata]);

    return res.status(201).json({ message: 'historique ajouté' }); // ✅ return ici
  } catch (err) {
    console.error('Erreur ajout historique :', err);
    return res.status(500).json({ error: 'Erreur serveur' }); // ✅ return ici aussi
  }
});

// 🧪 (Optionnel) récupérer l'historique d'une fiche
router.get('/:ficheId', async (req, res) => {
  const ficheId = req.params.ficheId;

  try {
    const result = await db.query(
      `SELECT * FROM historique_files WHERE fiche_id = $1 ORDER BY created_at DESC`,
      [ficheId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur récupération historique :', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
