import pool from "../config/db.js";

export const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, nom, email, telephone, role, statut, date_creation FROM utilisateurs");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, nom, email, telephone, role, statut, date_creation FROM utilisateurs WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
