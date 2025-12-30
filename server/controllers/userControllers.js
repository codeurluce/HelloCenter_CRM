// controllers/userControllers.js
const db = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
  findUserByEmail,
  createUserWithGeneratedEmail,
} = require("../models/userModels");
const { getIo } = require("../socketInstance");
const { closeSessionForce } = require("./sessionControllers");

// Vérifier que JWT_SECRET est défini
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined!");
}

// Vérification du token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ message: "Token requis" });

  try {
    const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide" });
  }
};

// ✅ Controller : validation de la session
const validateSession = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("[BACK] validateSession appelé pour userId:", userId);

    const result = await db.query(
      "SELECT session_closed, is_connected FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      console.log("[BACK] Utilisateur introuvable");
      return res
        .status(404)
        .json({ valid: false, message: "Utilisateur introuvable" });
    }

    const { session_closed, is_connected } = result.rows[0];
    console.log(
      "[BACK] session_closed:",
      session_closed,
      "is_connected:",
      is_connected
    );

    const valid = !session_closed && is_connected;
    console.log("[BACK] valid =", valid);

    return res.json({ valid });
  } catch (error) {
    console.error("❌ Erreur validateSession:", error.message);
    return res.status(500).json({ valid: false, error: "Erreur serveur" });
  }
};

// Création d’un utilisateur avec génération automatique d'email + mot de passe
const createUser = async (req, res) => {
  const {
    lastname,
    firstname,
    role,
    profil,
    site_id: newUserSiteId,
  } = req.body;
  const { role: creatorRole, site_id: creatorSiteId } = req.user;
  console.log("site_id reçu :", newUserSiteId);

  // Vérification du rôle
  if (creatorRole !== "SuperAdmin" && role === "SuperAdmin") {
    return res.status(403).json({
      message:
        "Vous ne pouvez pas créer un utilisateur avec le role: super admin.",
    });
  }

  // Vérification du site pour les admins
  if (creatorRole !== "SuperAdmin" && newUserSiteId !== creatorSiteId) {
    return res.status(403).json({
      message: "Vous ne pouvez créer des utilisateurs que dans votre site.",
    });
  }
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Création de l'utilisateur
    const { user, plainPassword } = await createUserWithGeneratedEmail(
      lastname,
      firstname,
      role,
      profil,
      newUserSiteId
    );
    console.log("✅ User créé :", user);

    // Insérer une ligne vide dans la table contrat liée à ce user
    await client.query(
      `INSERT INTO contrat (user_id, site_id) VALUES ($1, $2)`,
      [user.id, newUserSiteId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      email: user.email,
      tempPassword: plainPassword,
    });
  } catch (err) {
    await client.query("ROLLBACK"); // ❌ Annuler en cas d’erreur
    console.error(err);
    res
      .status(500)
      .json({ error: "Erreur lors de la création de l’utilisateur" });
  } finally {
    client.release(); // ✅ Libérer la connexion
  }
};

// Mettre à jour un utilisateur
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { firstname, lastname, email, role, profil, site_id } = req.body;
  const { role: updaterRole, site_id: updaterSiteId } = req.user;

  if (!firstname || !lastname || !email || !role || !profil) {
    return res.status(400).json({ message: "Champs manquants." });
  }

  // Vérifier que l'utilisateur existe
  const userCheck = await db.query("SELECT * FROM users WHERE id = $1", [id]);
  if (!userCheck.rows.length) {
    return res.status(404).json({ message: "Utilisateur non trouvé." });
  }

  const targetUser = userCheck.rows[0];

  if (updaterRole !== "SuperAdmin" && role === "SuperAdmin") {
    return res.status(403).json({
      message: "Vous ne pouvez pas attribuer le rôle super admin.",
    });
  }

  // Vérification du site pour les admins
  if (updaterRole !== "SuperAdmin" && site_id !== updaterSiteId) {
    return res.status(403).json({
      message: "Vous ne pouvez modifier un agent que dans votre site.",
    });
  }

  try {
    const query = `
      UPDATE users
      SET firstname = $1,
          lastname = $2,
          email= $3,
          role = $4,
          profil = $5,
          site_id   = $6,
          updated_at = NOW()
      WHERE id = $7
      RETURNING id, firstname, lastname, email, role, profil, site_id;;
    `;

    const values = [firstname, lastname, email, role, profil, site_id, id];

    const result = await db.query(query, values);
    res.json({
      message: "Utilisateur mis à jour.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur updateUser:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// Suppression d'un utilisateur qui n'a jamais été connnecté
const deleteUserByAdmin = async (req, res) => {
  const userId = req.params.id;
  const requester = req.user; // info du token : id + role

  if (!userId) return res.status(400).json({ error: "userId manquant" });
  if (requester.id === userId)
    return res
      .status(400)
      .json({ error: "Vous ne pouvez pas vous supprimer vous-même." });
  if (requester.role !== "Admin")
    return res
      .status(403)
      .json({
        error: "Vous n'avez pas la permission de supprimer cet utilisateur.",
      });

  try {
    // Vérifier si l'utilisateur existe
    const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ error: "Utilisateur non trouvé" });

    // Vérifier les dépendances
    const [ventesRes] = await Promise.all([
      db.query("SELECT COUNT(*) FROM sales WHERE agent_id = $1", [userId]),
      // db.query("SELECT COUNT(*) FROM files WHERE agent_id = $1", [userId]),
    ]);

    const hasVentes = Number(ventesRes.rows[0].count) > 0;
    // const hasFiches = Number(fichesRes.rows[0].count) > 0;

    if (hasVentes) {
      // Soft delete
      await db.query("UPDATE users SET is_active = FALSE WHERE id = $1", [
        userId,
      ]);
      return res.json({
        success: true,
        message:
          "Cet agent a des ventes liées. Impossible de supprimer. \nLe compte a été désactivé.",
      });
    }

    //     if (hasFiches) {
    //   // Moins critique, mais tu peux garder soft delete par sécurité
    //   await db.query("UPDATE users SET is_active = FALSE WHERE id = $1", [userId]);
    //   return res.json({ success: true, message: "L’agent a des fiches liées. Compte désactivé." });
    // }

    // Suppression physique
    await db.query("DELETE FROM users WHERE id = $1", [userId]);
    return res.json({
      success: true,
      message: "Utilisateur supprimé définitivement",
    });
  } catch (err) {
    console.error("Erreur deleteUserByAdmin:", err);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
};

const changePasswordFirstLogin = async (req, res) => {
  const { password } = req.body;
  const userId = req.user.id;

  try {
    // Récupérer utilisateur
    const result = await db.query("SELECT password FROM users WHERE id=$1", [
      userId,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Utilisateur non trouvé" });

    const oldHashedPassword = result.rows[0].password;

    // Comparer le nouveau mot de passe avec l’ancien haché
    const isSamePassword = await bcrypt.compare(password, oldHashedPassword);
    if (isSamePassword) {
      return res
        .status(400)
        .json({
          message:
            "Le nouveau mot de passe ne peut pas être identique à l'ancien.",
        });
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
    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Mot de passe invalide" });

    // Vérifier si le compte est désactivé
    if (!user.is_active) {
      return res
        .status(403)
        .json({ message: "Compte désactivé, connexion impossible" });
    }

    // Vérification de l'expiration du mot de passe (90 jours/ 3mois)
    const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000; // 90 jours en ms
    const now = Date.now();
    const lastChange = user.password_changed_at
      ? new Date(user.password_changed_at).getTime()
      : 0;
    const isPasswordExpired = now - lastChange > THREE_MONTHS_MS;

    // Vérification de l'expiration du mot de passe (2 jours) pour faire des test
    // const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    // const lastChange = user.password_changed_at
    //   ? new Date(user.password_changed_at).getTime()
    //   : 0;
    // const isPasswordExpired = (Date.now() - lastChange) > TWO_DAYS_MS;

    const mustChangePassword = {
      required: user.is_first_login || isPasswordExpired,
      reason: user.is_first_login
        ? "first_login"
        : isPasswordExpired
        ? "expired"
        : null,
    };

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        univers: user.profil,
        site_id: user.site_id,
        is_first_login: user.is_first_login,
        etatCompte: user.is_active,
      },
      JWT_SECRET,
      { expiresIn: "3d" }
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
        site_id: user.site_id,
        etatCompte: user.is_active,
        is_first_login: user.is_first_login,
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
    // 🔒 Fermer toute session orpheline
    await db.query(
      `
      UPDATE session_agents 
      SET end_time = NOW()
      WHERE user_id = $1 AND end_time IS NULL
    `,
      [userId]
    );

    // Marquer agent connecté
    await db.query(
      "UPDATE users SET is_connected = TRUE, session_closed = FALSE WHERE id = $1",
      [userId]
    );

    // Historique des connexions
    await db.query(
      "INSERT INTO agent_connections_history (user_id, event_type) VALUES ($1, 'connect')",
      [userId]
    );

    const io = getIo();
    //  Émettre l’événement à tous les admins
    io.emit("agent_connected", { userId });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la connexion de l’agent" });
  }
};

const handleAgentDisconnect = async (userId, eventType = "disconnect") => {
  try {
    // Fermer la session active
    await db.query(
      `UPDATE session_agents SET end_time = NOW() WHERE user_id = $1 AND end_time IS NULL`,
      [userId]
    );

    // Marquer comme déconnecté
    await db.query("UPDATE users SET is_connected = FALSE WHERE id = $1", [
      userId,
    ]);

    // Historique
    await db.query(
      "INSERT INTO agent_connections_history (user_id, event_type) VALUES ($1, $2)",
      [userId, eventType]
    );

    console.log(
      `🔌 Déconnexion automatique traitée pour userId ${userId} (${eventType})`
    );
  } catch (err) {
    console.error(
      `❌ Erreur dans handleAgentDisconnect (userId=${userId}) :`,
      err
    );
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
    await handleAgentDisconnect(userId, "disconnect");

    // 🔔 Émettre l’événement à tous les admins
    const io = getIo();
    io.emit("agent_disconnected", { userId });

    res.json({
      success: true,
      message: "Déconnexion réussie et session sauvegardés.",
    });
  } catch (err) {
    console.error("Erreur disconnectAgent:", err);
    res.status(500).json({ error: "Erreur lors de la déconnexion de l’agent" });
  }
};

// Déconnexion forcée de l'agent pour inactivité
const disconnectAgentForce = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId manquant" });
  }

  try {
    await handleAgentDisconnect(userId, "auto_disconnect");

    // 🔔 Émettre l’événement à tous les admins pour live update
    const io = getIo();
    io.emit("agent_disconnected", { userId });

    res.json({
      success: true,
      message: "Déconnexion forcée traitée.",
    });
  } catch (err) {
    console.error("❌ Erreur disconnectAgentForce:", err);
    res.status(500).json({ error: "Erreur lors de la déconnexion forcée" });
  }
};

// POST /agents/disconnect
const disconnectAgentbyAdmin = async (req, res) => {
  const userId = req.params.id;
  const requester = req.user;

  if (!userId) {
    return res.status(400).json({ error: "userId manquant" });
  }

  // Permissions
  if (requester.id.toString() === userId.toString()) {
    return res
      .status(400)
      .json({ error: "Vous ne pouvez pas vous déconnecter vous-même" });
  }

  if (requester.role !== "Admin") {
    return res
      .status(403)
      .json({ error: "Action réservée aux administrateurs" });
  }

  try {
    const userRes = await db.query(
      "SELECT is_connected FROM users WHERE id = $1",
      [userId]
    );
    if (!userRes.rows[0]?.is_connected) {
      return res.status(400).json({ error: "Déjà déconnecté" });
    }

    await handleAgentDisconnect(userId, "disconnectByAdmin");

    // ⚡ Remplacer TOUT ton code par un seul appel :
    const result = await closeSessionForce(
      userId,
      req.app.locals.userSockets,
      requester.id
    );

    const io = getIo();
    io.to("admins").emit("agent_disconnected_for_admin", { userId });

    res.json({ success: true, result });
  } catch (err) {
    console.error("Erreur disconnectAgentbyAdmin:", err);
    res.status(500).json({ error: "Erreur déconnexion admin" });
  }
};

// Infos utilisateur connecté
const getMe = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT id, lastname, firstname, email, role, profil, site_id, created_at FROM users WHERE id = $1`,
      [userId]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
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
    const { role, site_id: userSiteId } = req.user;
    const { site_id } = req.query; // 👈 filtre choisi par SuperAdmin

    if (role !== "Admin" && role !== "SuperAdmin") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    let query = `
      SELECT id, lastname, firstname, email, role, profil, is_active, site_id, created_at
      FROM users
      WHERE 1=1
    `;
    let params = [];

    // 🔒 Admin → son site seulement
    if (role === "Admin") {
      params.push(userSiteId);
      query += ` AND site_id = $${params.length}`;
    }

    // 👑 SuperAdmin → site choisi (optionnel)
    if (role === "SuperAdmin" && site_id) {
      params.push(site_id);
      query += ` AND site_id = $${params.length}`;
    }

    query += ` ORDER BY is_active DESC, lastname ASC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Erreur getAllUsers:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// recuperation des users, pour faire les assignations des fiches
const getAllUsersBd = async (req, res) => {
  try {
    const { role, site_id: userSiteId } = req.user;
    const { site_id } = req.query; // 👈 filtre optionnel (SuperAdmin)

    if (role !== "Admin" && role !== "SuperAdmin") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    let query = `
      SELECT id, firstname, lastname, email, role, site_id
      FROM users
      WHERE is_active = true
    `;
    let params = [];

    // 🔒 Admin → uniquement son site
    if (role === "Admin") {
      params.push(userSiteId);
      query += ` AND site_id = $${params.length}`;
    }

    // 👑 SuperAdmin → filtre site si fourni
    if (role === "SuperAdmin" && site_id) {
      params.push(site_id);
      query += ` AND site_id = $${params.length}`;
    }

    query += ` ORDER BY lastname ASC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération agents:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = { getAllUsersBd };


// Activer/Désactiver un user
const toggleActiveUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Récupérer l’état actuel
    const userResult = await db.query(
      "SELECT is_active FROM users WHERE id = $1",
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
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
      message: `Utilisateur ${
        !currentStatus ? "activé" : "désactivé"
      } avec succès`,
      user: updated.rows[0],
    });
  } catch (error) {
    console.error("Erreur toggle user :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const resetPasswordByAdmin = async (req, res) => {
  try {
    const { id: userId } = req.params;

    // On récupère le nom de famille de l'utilisateur pour générer le mot de passe
    const userResult = await db.query(
      `SELECT lastname FROM users WHERE id = $1`,
      [userId]
    );
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

// Suppression d'un agent

module.exports = {
  createUser,
  deleteUserByAdmin,
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
  disconnectAgentForce,
  validateSession,
  disconnectAgentbyAdmin,
  handleAgentDisconnect,
};
