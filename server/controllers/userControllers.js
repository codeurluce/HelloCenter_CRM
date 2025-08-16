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

// Création manuelle d’un agent (avec mot de passe fourni)
const createAgent = async (req, res) => {
  const {
    lastname,
    firstname,
    email,
    password,
    role,
    profil,
    is_first_login,
    password_changed_at,
  } = req.body;

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users 
       (lastname, firstname, email, password, role, profil, is_first_login, password_changed_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, lastname, firstname, email, role, profil`,
      [
        lastname,
        firstname,
        email,
        hashedPassword,
        role,
        profil,
        is_first_login ?? true,
        password_changed_at ?? new Date(),
      ]
    );

    const newUser = result.rows[0];
    res.status(201).json({ message: 'Agent créé avec succès', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur lors de la création de l’agent" });
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

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        univers: user.profil,
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
  createAgent,
  loginUser,
  verifyToken,
  getMe,
  getAllUsers,
};
