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

    // Récupérer utilisateur
    const result = await db.query('SELECT password FROM users WHERE id=$1', [userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const oldHashedPassword = result.rows[0].password;

    // Comparer le nouveau mot de passe avec l’ancien haché
    const isSamePassword = await bcrypt.compare(password, oldHashedPassword);
    if (isSamePassword) {
      return res.status(400).json({ message: "Le nouveau mot de passe ne peut pas être identique à l'ancien." });
    }

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

    // Vérifier si le compte est désactivé
    if (!user.is_active) {
      return res.status(403).json({ message: 'Compte désactivé, connexion impossible' });
    }

    // Vérification de l'expiration du mot de passe (90 jours/ 3mois)
    const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000; // 90 jours en ms
    const now = Date.now();
    const lastChange = user.password_changed_at
      ? new Date(user.password_changed_at).getTime()
      : 0;
    const isPasswordExpired = (now - lastChange) > THREE_MONTHS_MS;

    // Vérification de l'expiration du mot de passe (2 jours) pour faire des test
    // const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    // const lastChange = user.password_changed_at
    //   ? new Date(user.password_changed_at).getTime()
    //   : 0;
    // const isPasswordExpired = (Date.now() - lastChange) > TWO_DAYS_MS;

    const mustChangePassword = {
      required: user.is_first_login || isPasswordExpired,
      reason: user.is_first_login ? 'first_login' : isPasswordExpired ? 'expired' : null,
    };

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        univers: user.profil,
        is_first_login: user.is_first_login,
        etatCompte: user.is_active
      },
      JWT_SECRET,
      { expiresIn: '3d' }
    );
    res.status(200).json({
      token,
      mustChangePassword,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        univers: user.profil,
        etatCompte: user.is_active,
        is_first_login: user.is_first_login
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de la connexion" });
  }
};

// Connexion de l'agent
const connectAgent = async (req, res) => {
  const { userId } = req.body;
  try {
    await db.query("UPDATE users SET is_connected = TRUE WHERE id = $1", [userId]);
    await db.query(
      "INSERT INTO agent_connections_history (user_id, event_type) VALUES ($1, 'connect')",
      [userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la connexion de l’agent' });
  }
};

// Déconnexion de l'agent
const disconnectAgent = async (req, res) => {
  const { userId } = req.body; 

    if (!userId) {
    return res.status(400).json({ error: "userId manquant" });
  }

  try {
        // Fermer la session active
    await db.query(
      `UPDATE session_agents
       SET end_time = NOW(),
           duration = EXTRACT(EPOCH FROM (NOW() - start_time))
       WHERE user_id = $1 AND end_time IS NULL`,
      [userId]
    );

    // Marquer l’agent comme déconnecté
    await db.query("UPDATE users SET is_connected = FALSE WHERE id = $1", [userId]);

    //  Ajouter un événement dans l’historique des connexions
    await db.query(
      "INSERT INTO agent_connections_history (user_id, event_type) VALUES ($1, 'disconnect')",
      [userId]
    );

    res.json({ success: true, message: "Déconnexion réussie et session sauvegardés." });
  } catch (err) {
    console.error("Erreur disconnectAgent:", err);
    res.status(500).json({ error: "Erreur lors de la déconnexion de l’agent" });
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
      `SELECT id, lastname, firstname, email, role, profil, is_active, created_at 
       FROM users
       ORDER BY lastname ASC`
    );

    const users = result.rows.map(u => ({
      ...u,
      active: u.is_active === true || u.is_active === 1, // booléen
    }));

    res.json(users);
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des utilisateurs" });
  }
};


const getAllUsersBd = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const result = await db.query(
      `SELECT id, firstname, lastname, email, role, is_active, created_at
       FROM users
       WHERE role = 'Agent' AND is_active = true
       ORDER BY lastname ASC`
    );

    const agents = result.rows.map(u => ({
      id: u.id,
      name: `${u.firstname} ${u.lastname}`,
      email: u.email,
    }));

    res.json(agents);
  } catch (error) {
    console.error("Erreur récupération agents:", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des agents" });
  }
};

// Activer/Désactiver un user
const toggleActiveUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Récupérer l’état actuel
    const userResult = await db.query(
      'SELECT is_active FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const currentStatus = userResult.rows[0].is_active;

    // Inverser l’état (toggle)
    const updated = await db.query(
      `UPDATE users 
        SET is_active = $1 
        WHERE id = $2 
        RETURNING id, firstname, lastname, email, role, profil, is_active`,
      [!currentStatus, id]
    );

    res.json({
      message: `Utilisateur ${!currentStatus ? 'activé' : 'désactivé'} avec succès`,
      user: updated.rows[0],
    });
  } catch (error) {
    console.error('Erreur toggle user :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour un utilisateur
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { firstname, lastname, email, role, profil } = req.body;

  if (!firstname || !lastname || !email || !role || !profil) {
    return res.status(400).json({ message: "Champs manquants." });
  }

  try {
    // Vérifier que l'utilisateur existe
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!userCheck.rows.length) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    const query = `
      UPDATE users
      SET firstname = $1,
          lastname = $2,
          email= $3,
          role = $4,
          profil = $5,
          updated_at = NOW()
      WHERE id = $6
      RETURNING id, firstname, lastname, email, role, profil;
    `;

    const values = [firstname, lastname, email, role, profil, id]

    const result = await db.query(query, values);

    res.json({ message: "Utilisateur mis à jour.", user: result.rows[0] });
  } catch (error) {
    console.error("Erreur updateUser:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

const resetPasswordByAdmin = async (req, res) => {
  try {
    const { id: userId } = req.params;

    // On récupère le nom de famille de l'utilisateur pour générer le mot de passe
    const userResult = await db.query(`SELECT lastname FROM users WHERE id = $1`, [userId]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    const lastname = userResult.rows[0].lastname;

    // Génération du mot de passe temporaire
    const tempPassword = `HC@${lastname.toLowerCase()}${new Date().getFullYear()}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Mise à jour du mot de passe
    await db.query(
      `UPDATE users 
       SET password = $1, is_first_login = true, updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, userId]
    );

    // Réponse à l’admin
    res.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès.",
      temporaryPassword: tempPassword, // ⚠️ à afficher uniquement à l’admin
    });
  } catch (err) {
    console.error("Erreur resetPasswordByAdmin:", err);
    res.status(500).json({ error: "Erreur serveur." });
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
  toggleActiveUser,
  updateUser,
  resetPasswordByAdmin,
  connectAgent,
  disconnectAgent,
  getAllUsersBd,
};
