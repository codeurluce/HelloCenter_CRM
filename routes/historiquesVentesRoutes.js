const express = require('express');
const router = express.Router();
const { getSaleHistory } = require('../salesHistory');

// 🧪 (Optionnel) récupérer l'historique d'une fiche
router.get('/:saleId', async (req, res) => {
   const { saleId } = req.params;

  try {
    const history = await getSaleHistory(saleId);
    res.json(history);
  } catch (err) {
    console.error('Erreur récupération historique :', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
