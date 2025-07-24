const db = require('../db');
const bcrypt = require('bcrypt');

function generateCompanyEmail(firstname, lastname, domain = 'hellocenter.sn') {
  const email = `${firstname.toLowerCase()}.${lastname.toLowerCase()}@${domain}`;
  return email;
}

function generateTempPassword(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$!';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const findUserByEmail = async (email) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

const createUserWithGeneratedEmail = async (lastname, firstname, role = 'Agent', profil = 'Available') => {
  const email = generateCompanyEmail(firstname, lastname);
  const tempPassword = `HC@${lastname.toLowerCase()}${new Date().getFullYear()}`;
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const result = await db.query(
    `INSERT INTO users (lastname, firstname, email, password, role, profil, is_first_login, password_changed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [lastname, firstname, email, hashedPassword, role, profil, true, new Date()]
  );

  return {
    user: result.rows[0],
    plainPassword: tempPassword,
  };
};

module.exports = {
  createUserWithGeneratedEmail,
  findUserByEmail,
};
