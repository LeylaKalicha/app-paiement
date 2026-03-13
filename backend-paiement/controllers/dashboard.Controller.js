import db from "../config/db.js";

export const getDashboard = async (req, res) => {
  try {
    // req.user vient du middleware (verifyToken)
    const userId = req.user.id;

    const [rows] = await db.execute(
      "SELECT id, nom, email FROM utilisateur WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    res.status(200).json({
      user: rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};