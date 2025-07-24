const db = require('../db');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail } = require('../models/userModels');
const { verifyToken } = require('../controllers/userControllers');

// Vérifier que JWT_SECRET est défini au démarrage
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined!');
}

// Handler pour créer un agent (création d'utilisateur)
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
    res.status(500).json({ message: 'Erreur serveur lors de la création de l’agent' });
  }
};

// Route POST /api/create-agent
router.post('/create-agent', createAgent);

// Route POST /api/register (inscription de nouvel utilisateur)
router.post('/register', async (req, res) => {
  const { lastname, firstname, email, password, role, profil } = req.body;

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
      [lastname, firstname, email, hashedPassword, role, profil, true, new Date()]
    );

    const newUser = result.rows[0];
    res.status(201).json({ message: 'Utilisateur enregistré', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route POST /api/login (connexion)
router.post('/login', async (req, res) => {
  console.log("Requête reçue:", req.body);
  const { email, password } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Mot de passe incorrect' });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '3d' });

    res.json({
      token,
      user: {
        id: user.id,
        lastname: user.lastname,
        firstname: user.firstname,
        email: user.email,
        role: user.role,
        profil: user.profil,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route GET /api/me (infos utilisateur connecté)
router.get('/me', verifyToken, async (req, res) => {
  const userId = req.user.userId;

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
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
