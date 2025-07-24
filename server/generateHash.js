// generateHash.js
const bcrypt = require('bcrypt');

const plainPassword = 'admin'; // <-- Remplace par ton mot de passe réel
bcrypt.hash(plainPassword, 10, (err, hash) => {
  if (err) throw err;
  console.log('Mot de passe hashé :', hash);
});