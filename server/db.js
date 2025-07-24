// db.js
require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ou config individuelle
});

pool.connect()
  .then(() => console.log('✅ Base de données connectée'))
  .catch(err => {
    console.error('❌ Erreur de connexion à la base de données :', err);
    process.exit(1); // stop le serveur si pas de connexion
  });

module.exports = {
  query: (text, params) => pool.query(text, params),
};
