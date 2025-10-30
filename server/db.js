// db.js
require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const { Pool } = require('pg');
const isProduction = process.env.NODE_ENV === 'production';


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,  // ou config individuelle
ssl: isProduction ? { rejectUnauthorized: false } : false // obligatoire pour PostgreSQL cloud
});

pool.connect()
  .then(() => console.log('✅ Base de données connectée'))
  .catch(err => {
    console.error('❌ Erreur de connexion à la base de données :', err);
    process.exit(1); // stop le serveur si pas de connexion
  });

module.exports = pool;
