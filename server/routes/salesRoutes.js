const express = require('express');
const router = express.Router();
const pool = require('../db'); // chemin vers ta config PostgreSQL
const { getTodaySummary } = require('../controllers/salesControllers');
const  auth  = require('../middlewares/authMiddleware');

// GET /api/sales/weekly  pour consulter les ventes hebdomadaires par jour une barre
router.get('/weekly', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        DATE(created_at) AS day,
        COUNT(*) AS total_sales,
        COUNT(CASE WHEN status = 'validated' THEN 1 END) AS validated_sales
      FROM sales
      WHERE created_at >= date_trunc('week', CURRENT_DATE)
        AND created_at < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
      GROUP BY day
      ORDER BY day;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


// GET /api/sales/today-summary
router.get('/today-summary', async (req, res) => {
  try {
    const result = await pool.query(`
       SELECT 
    COUNT(*) AS total_sales_today,
    COUNT(CASE WHEN status = 'validated' THEN 1 END) AS validated_sales_today,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_sales_today,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_sales_today
  FROM sales
  WHERE DATE(created_at) = CURRENT_DATE;
`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;