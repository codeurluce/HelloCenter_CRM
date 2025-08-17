// controllers/userControllers.js
const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { findUserByEmail, createUserWithGeneratedEmail } = require('../models/userModels');

// Vérifier que JWT_SECRET est défini
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined!");
}

// Création d’un utilisateur avec génération automatique d'email + mot de passe
const createUser = async (req, res) => {
  const { lastname, firstname, role, profil } = req.body;

  try {
    const { user, plainPassword } = await createUserWithGeneratedEmail(
      lastname,
      firstname,
      role,
      profil
    );
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      email: user.email,
      tempPassword: plainPassword,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la création de l’utilisateur" });
  }
};

const changePasswordFirstLogin = async (req, res) => {
  const { password } = req.body;
  const userId = req.user.id;

  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      `UPDATE users SET password=$1, is_first_login=false, password_changed_at=NOW() WHERE id=$2`,
      [hashed, userId]
    );
    res.json({ success: true, message: "Mot de passe changé avec succés" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Connexion utilisateur
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Mot de passe invalide' });

    // Vérification de l'expiration du mot de passe (90 jours)
    // const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000; // 90 jours en ms
    // const now = Date.now();
    // const lastChange = user.password_changed_at
    //   ? new Date(user.password_changed_at).getTime()
    //   : 0;
    // const isPasswordExpired = (now - lastChange) > THREE_MONTHS_MS;


    // Vérification de l'expiration du mot de passe (2 jours)
    // const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    // Vérification de l'expiration du mot de passe (2 jours)
    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    const lastChange = user.password_changed_at
      ? new Date(user.password_changed_at).getTime()
      : 0;
    const isPasswordExpired = (Date.now() - lastChange) > TWO_DAYS_MS;

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        univers: user.profil,
        mustChangePassword: user.is_first_login || isPasswordExpired
      },
      JWT_SECRET,
      { expiresIn: '3d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        univers: user.profil,
        mustChangePassword: user.is_first_login || isPasswordExpired
      },
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
    const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide' });
  }
};

// Infos utilisateur connecté
const getMe = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT id, lastname, firstname, email, role, profil FROM users WHERE id = $1`,
      [userId]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Récupérer tous les utilisateurs (admin seulement)
const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const result = await db.query(
      `SELECT id, lastname, firstname, email, role, profil 
       FROM users
       ORDER BY lastname ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des utilisateurs" });
  }
};

module.exports = {
  createUser,
  // createAgent,
  loginUser,
  verifyToken,
  getMe,
  getAllUsers,
  changePasswordFirstLogin,
};
