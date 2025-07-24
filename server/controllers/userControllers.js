// userControllers.js
const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { createUserWithGeneratedEmail } = require('../models/userModels');

// Création d’un utilisateur
const createUser = async (req, res) => {
  const { lastname, firstname, role, profil } = req.body;

  try {
    const { user, plainPassword } = await createUserWithGeneratedEmail(lastname, firstname, role, profil);
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      email: user.email,
      tempPassword: plainPassword
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la création de l’utilisateur' });
  }
};

// Connexion
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      console.log("Email reçu dans la requête:", email);
      console.log("Résultat de la requête SQL:", result.rows);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
      
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mot de passe invalide' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de la connexion" });
  }
};

// Vérification du token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Token requis' });

  try {
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide' });
  }
};

module.exports = {
  createUser,
  loginUser,
  verifyToken
};
