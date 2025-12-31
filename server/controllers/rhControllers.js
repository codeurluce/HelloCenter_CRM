// controllers/rhControllers.js
const db = require("../db");
const dayjs = require("dayjs");

// recuperation des users et des contrats pour l'afficher dans AgentList.tsx
const getUsersContrat = async (req, res) => {
  try {
    const { role } = req.user;
    const siteId = req.siteId; // injecté par siteScope

    if (role !== "Admin" && role !== "SuperAdmin") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    let query = `
      SELECT 
        u.id,
        u.lastname,
        u.firstname,
        u.email,
        u.role,
        u.profil,
        u.is_active,
        u.created_at,

        c.id AS contrat_id,
        c.type_contrat,
        c.date_integration,
        c.date_debut_contrat,
        c.date_fin_contrat,
        c.poste,
        c.situation_matrimoniale,
        c.numero_cni_ou_passeport,
        c.adresse,
        c.code_postal,
        c.telephone,
        c.age,
        c.genre_sexe,
        c.mail_perso,
        c.matricule,
        c.date_naissance,
        c.type_piece,
        c.updated_by,
        c.etat_contrat,
        s.id AS site_id,
        s.code AS site_code,
        s.name AS site_name
      FROM users u
      LEFT JOIN contrat c ON c.user_id = u.id
      LEFT JOIN sites s ON s.id = u.site_id
      WHERE u.is_active = true
    `;

    const params = [];

    // 🔒 ADMIN → limité à son site
    if (role === "Admin") {
      query += ` AND u.site_id = $1`;
      params.push(siteId);
    }

    query += ` ORDER BY u.lastname ASC`;

    const result = await db.query(query, params);

    const users = result.rows.map((u) => ({
      id: u.id,
      lastname: u.lastname,
      firstname: u.firstname,
      email: u.email,
      role: u.role,
      profil: u.profil,
      active: u.is_active === true || u.is_active === 1,
      created_at: u.created_at,
      site: u.site_id
        ? { id: u.site_id, code: u.site_code, name: u.site_name }
        : null,
      contrat: u.contrat_id
        ? {
            id: u.contrat_id,
            type_contrat: u.type_contrat,
            date_integration: u.date_integration,
            date_debut_contrat: u.date_debut_contrat,
            date_fin_contrat: u.date_fin_contrat,
            poste: u.poste,
            situation_matrimoniale: u.situation_matrimoniale,
            numero_cni_ou_passeport: u.numero_cni_ou_passeport,
            adresse: u.adresse,
            code_postal: u.code_postal,
            telephone: u.telephone,
            age: u.age,
            genre_sexe: u.genre_sexe,
            mail_perso: u.mail_perso,
            matricule: u.matricule,
            date_naissance: u.date_naissance,
            type_piece: u.type_piece,
            updated_by: u.updated_by,
            etat_contrat: u.etat_contrat
          }
        : null,
    }));

    res.json(users);
  } catch (error) {
    console.error("Erreur récupération utilisateurs/contrats:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// modification des infos du contrat dans UsersContratFormsModal.tsx
const updateAgentContract = async (req, res) => {
  const { id: userId } = req.params;
  const siteId = req.siteId;
  const role = req.user.role;
  const updatedBy = req.user.id;

  if (!userId) {
    return res.status(400).json({ error: "Identifiant utilisateur manquant." });
  }

  const {
    type_contrat,
    date_integration,
    date_debut_contrat,
    date_fin_contrat,
    poste,
    situation_matrimoniale,
    numero_cni_ou_passeport,
    adresse,
    code_postal,
    telephone,
    genre_sexe,
    mail_perso,
    matricule,
    date_naissance,
    type_piece,
    etat_contrat,
  } = req.body;

  // 🔢 Calcul âge
  let age = null;
  if (date_naissance) {
    const birth = new Date(date_naissance);
    const today = new Date();
    age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  }

  try {
    // 🔒 Vérifier que l'utilisateur existe ET appartient au site (Admin)
    const userCheck = await db.query(
      `SELECT id FROM users WHERE id = $1 AND site_id = $2`,
      [userId, siteId]
    );

    if (role === "Admin" && userCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Accès interdit à cet utilisateur" });
    }

    // 🔍 Vérifier existence du contrat
    const contratExists = await db.query(
      `SELECT id FROM contrat WHERE user_id = $1`,
      [userId]
    );

    // ❌ Validations métier
    if (!poste || !type_contrat) {
      return res
        .status(400)
        .json({ error: "Poste et type de contrat sont obligatoires." });
    }

    if (
      date_debut_contrat &&
      date_fin_contrat &&
      new Date(date_debut_contrat) > new Date(date_fin_contrat)
    ) {
      return res.status(400).json({
        error: "La date de début ne peut pas être après la date de fin.",
      });
    }

    if (mail_perso && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail_perso)) {
      return res.status(400).json({ error: "Email personnel invalide." });
    }

    if (telephone && !/^[0-9+\-()\s]+$/.test(telephone)) {
      return res.status(400).json({ error: "Téléphone invalide." });
    }

    // 🔁 UPDATE
    if (contratExists.rows.length > 0) {
      await db.query(
        `
        UPDATE contrat SET
          type_contrat = $1,
          date_integration = $2,
          date_debut_contrat = $3,
          date_fin_contrat = $4,
          poste = $5,
          situation_matrimoniale = $6,
          numero_cni_ou_passeport = $7,
          adresse = $8,
          code_postal = $9,
          telephone = $10,
          age = $11,
          genre_sexe = $12,
          mail_perso = $13,
          matricule = $14,
          date_naissance = $15,
          type_piece = $16,
          updated_at = NOW(),
          updated_by = $17,
          etat_contrat = $18
        WHERE user_id = $19
        `,
        [
          type_contrat,
          date_integration,
          date_debut_contrat,
          date_fin_contrat,
          poste,
          situation_matrimoniale,
          numero_cni_ou_passeport,
          adresse,
          code_postal,
          telephone,
          age,
          genre_sexe,
          mail_perso,
          matricule,
          date_naissance,
          type_piece,
          updatedBy,
          etat_contrat,
          userId,
        ]
      );
    }
    // ➕ INSERT
    else {
      await db.query(
        `
        INSERT INTO contrat (
          user_id, type_contrat, date_integration, date_debut_contrat, date_fin_contrat,
          poste, situation_matrimoniale, numero_cni_ou_passeport, adresse, code_postal,
          telephone, age, genre_sexe, mail_perso, matricule, date_naissance, type_piece,
          updated_at, updated_by, etat_contrat
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,$17,
          NOW(),$18,$19
        )
        `,
        [
          userId,
          type_contrat,
          date_integration,
          date_debut_contrat,
          date_fin_contrat,
          poste,
          situation_matrimoniale,
          numero_cni_ou_passeport,
          adresse,
          code_postal,
          telephone,
          age,
          genre_sexe,
          mail_perso,
          matricule,
          date_naissance,
          type_piece,
          updatedBy,
          etat_contrat,
        ]
      );
    }

    res.json({ message: "Contrat mis à jour avec succès" });
  } catch (err) {
    console.error("Erreur updateAgentContract:", err);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la mise à jour du contrat" });
  }
};


const getNotificationsFinContrat = async (req, res) => {
  try {
    const userId = req.user.id;
    const siteId = req.siteId;

    const result = await db.query(
      `
      SELECT 
        n.id,
        n.lu,
        n.created_at,
        c.type_contrat,
        c.date_fin_contrat,
        u.firstname,
        u.lastname
      FROM notifications n
      JOIN contrat c ON c.id = n.contrat_id
      JOIN users u ON u.id = c.user_id
      WHERE n.user_id = $1
        AND u.site_id = $2
      ORDER BY n.created_at DESC
    `,
      [userId, siteId]
    );

    const today = dayjs().startOf("day");

    const notifications = result.rows
      .map((row) => {
        const dateFin = dayjs(row.date_fin_contrat).startOf("day");
        const joursRestants = dateFin.diff(today, "day");

        // ❌ Ne pas notifier trop tôt
        if (joursRestants > 7) return null;

        let message = "";
        if (joursRestants > 1) {
          message = `Contrat de ${row.firstname} ${row.lastname} expire dans ${joursRestants} jours`;
        } else if (joursRestants === 1) {
          message = `Contrat de ${row.firstname} ${row.lastname} expire demain !`;
        } else if (joursRestants === 0) {
          message = `Contrat de ${row.firstname} ${row.lastname} prend fin aujourd'hui !`;
        } else {
          message = `Contrat de ${row.firstname} ${row.lastname} est expiré`;
        }

        return {
          id: row.id,
          nom: `${row.firstname} ${row.lastname}`,
          type_contrat: row.type_contrat,
          date_fin: row.date_fin_contrat,
          jours_restants: joursRestants,
          message,
          lu: row.lu,
          created_at: row.created_at,
        };
      })
      .filter(Boolean);

    res.json(notifications);
  } catch (err) {
    console.error("Erreur getNotificationsFinContrat:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Marquer une notification comme lue
const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id; // récupéré depuis token/session
    const notifId = parseInt(req.params.id, 10);

    const result = await db.query(
      `UPDATE notifications
       SET lu = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notifId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Notification introuvable" });
    }

    res.json({ success: true, message: "Notification marquée comme lue" });
  } catch (err) {
    console.error("Erreur mise à jour notification :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

async function checkContrats() {
  try {
    console.log("📄 Vérification des contrats RH...");

    const today = dayjs().startOf("day");

    // Tous les contrats
    const contrats = await db.query(`
      SELECT id, user_id, date_fin_contrat, type_contrat
      FROM contrat
      WHERE date_fin_contrat IS NOT NULL
    `);

    // Tous les RH/Admin
    const rhs = await db.query(`
      SELECT id
      FROM users
      WHERE role IN ('Admin')
    `);
    // WHERE role IN ('Admin', 'RH') si demain on separe RH et Admin

    for (const contrat of contrats.rows) {
      const { id: contratId, date_fin_contrat, type_contrat } = contrat;
      const dateFin = dayjs(date_fin_contrat).startOf("day");
      const joursRestants = dateFin.diff(today, "day");

      if (joursRestants > 7) continue;

      let message = "";
      if (joursRestants > 1) {
        message = `Contrat ${type_contrat} expire bientôt (${joursRestants} jours restants).`;
      } else if (joursRestants === 1) {
        message = `Contrat ${type_contrat} expire demain !`;
      } else if (joursRestants === 0) {
        message = `Contrat ${type_contrat} prend fin aujourd'hui !`;
      } else {
        continue; // contrat déjà expiré
      }

      for (const rh of rhs.rows) {
        const existing = await db.query(
          `SELECT id FROM notifications
           WHERE contrat_id = $1 AND user_id = $2 AND message = $3`,
          [contratId, rh.id, message]
        );

        if (existing.rows.length === 0) {
          await db.query(
            `INSERT INTO notifications (contrat_id, user_id, type, message, lu, created_at)
            VALUES ($1, $2, 'fin_contrat', $3, false, NOW())`,
            [contratId, rh.id, message]
          );
          console.log(
            `✅ Notification créée pour RH ${rh.id} (contrat ${contratId})`
          );
        }
      }
    }
  } catch (err) {
    console.error("Erreur lors de la vérification des contrats :", err);
  }
}

module.exports = {
  getUsersContrat,
  updateAgentContract,
  getNotificationsFinContrat,
  markNotificationAsRead,
  checkContrats,
};
