const express = require('express');
const router = express.Router();
const { getSaleHistory } = require('../salesHistory');
const auth = require('../middlewares/authMiddleware');
const siteScope = require('../middlewares/siteScope');

// Applique auth et siteScope à toutes les routes du router
router.use(auth);
router.use(siteScope);

// (Optionnel) récupérer l'historique d'une fiche
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
