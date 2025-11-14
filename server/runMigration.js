// runMigrations.js
const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runMigrations() {
  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    console.log(`🚀 Exécution de la migration: ${file}`);
    await db.query(sql);
  }

  console.log('✅ Toutes les migrations ont été appliquées.');
  process.exit();
}

runMigrations().catch(err => {
  console.error('❌ Erreur migration:', err);
  process.exit(1);
});