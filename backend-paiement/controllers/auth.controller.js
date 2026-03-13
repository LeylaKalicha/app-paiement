import db from "../config/db.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = "SECRET_KEY";

// ============================
// REGISTER
// ============================
export const register = (req, res) => {
  const { nom, email, motDePasse, telephone, type } = req.body;

  db.query(
    "SELECT * FROM Utilisateur WHERE email = ?",
    [email],
    (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length > 0) {
        return res.status(400).json({ message: "Email déjà utilisé" });
      }

      // ✅ On enregistre le mot de passe tel quel
      db.query(
        "INSERT INTO Utilisateur (nom, email, motDePasse, telephone, type) VALUES (?, ?, ?, ?, ?)",
        [nom, email, motDePasse, telephone, type || "USER"],
        (err) => {
          if (err) return res.status(500).json(err);

          res.status(201).json({ message: "Utilisateur créé avec succès" });
        }
      );
    }
  );
};

// ============================
// LOGIN
// ============================
export const login = (req, res) => {
  const { email, motDePasse } = req.body;

  db.query(
    "SELECT * FROM Utilisateur WHERE email = ?",
    [email],
    (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length === 0) {
        return res.status(400).json({ message: "Email incorrect" });
      }

      const user = result[0];

      // ✅ Comparaison directe (sans hash)
      if (motDePasse !== user.motDePasse) {
        return res.status(400).json({ message: "Mot de passe incorrect" });
      }

      const token = jwt.sign(
        { id: user.id, type: user.type },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({
        message: "Connexion réussie",
        token,
        user: {
          id: user.id,
          nom: user.nom,
          email: user.email,
          type: user.type
        }
      });
    }
  );
};