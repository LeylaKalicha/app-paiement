import db from "../config/db.js";

// ═══════════════════════════════════════════════════════════════
//  GET /api/notifications/mes-notifs
//  → MesNotifications.jsx : liste des notifications de l'utilisateur connecté
// ═══════════════════════════════════════════════════════════════
export const getMesNotifications = async (req, res) => {
  try {
    const utilisateur_id = req.utilisateur.id;

    const [notifications] = await db.query(
      `SELECT id, titre, message, dateEnvoi
       FROM notification
       WHERE utilisateur_id = ?
       ORDER BY dateEnvoi DESC
       LIMIT 100`,
      [utilisateur_id]
    );

    return res.status(200).json({ data: notifications });
  } catch (error) {
    console.error("Erreur getMesNotifications :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};