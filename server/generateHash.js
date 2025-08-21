// generateHash.js
const bcrypt = require('bcrypt');

const plainPassword = 'Test@123'; // <-- Remplace par ton mot de passe réel
bcrypt.hash(plainPassword, 10, (err, hash) => {
  if (err) throw err;
  console.log('Mot de passe hashé :', hash);
});