const db = require('../db');
const bcrypt = require('bcrypt');

function generateCompanyEmail(firstname, lastname, domain = 'hellocenter.org', suffix = '') {
    // Ajoute suffixe (ex: '2', '3', etc.) avant '@'
    const baseEmail = `${firstname.toLowerCase()}.${lastname.toLowerCase()}`;
    return suffix ? `${baseEmail}${suffix}@${domain}` : `${baseEmail}@${domain}`;
}

function generateTempPassword(length = 10) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$!';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ✅ Normalisation ici
const findUserByEmail = async (email) => {
    const result = await db.query(
        `SELECT id, firstname, lastname, email, role, profil, password, 
                is_first_login, password_changed_at, is_active
         FROM users
         WHERE email = $1`,
        [email]
    );

    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    return {
        ...user,
        active: user.is_active === true || user.is_active === 1, // booléen
    };
};

const createUserWithGeneratedEmail = async (lastname, firstname, role = 'Agent', profil = 'Available') => {
    let suffix = '';
    let email;
    let userExists = true;
    let counter = 1;

    // Chercher un email unique en ajoutant suffixe numérique si besoin
    while (userExists) {
        email = generateCompanyEmail(firstname, lastname, 'hellocenter.org', suffix);
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            counter++;
            suffix = counter.toString();
        } else {
            userExists = false;
        }
    }

    // Génération du mot de passe temporaire
    const tempPassword = `HC@${lastname.toLowerCase()}${new Date().getFullYear()}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const result = await db.query(
        `INSERT INTO users (lastname, firstname, email, password, role, profil, is_first_login, password_changed_at, is_active)  
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) 
         RETURNING *`,
        [lastname, firstname, email, hashedPassword, role, profil, true, new Date()]
    );

    const user = result.rows[0];

    return {
        user: {
            ...user,
            active: user.is_active === true || user.is_active === 1, // ✅ cohérent
        },
        plainPassword: tempPassword,
    };
};

module.exports = {
    createUserWithGeneratedEmail,
    findUserByEmail,
};
