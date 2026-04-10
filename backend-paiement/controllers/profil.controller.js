import db from "../config/db.js";
import bcrypt from "bcrypt";

// PUT /api/auth/profil — ProfilUtilisateur.jsx → sauvegarder()
export const modifierProfil = async (req, res) => {
  try {
    const { nom, telephone } = req.body;
    const userId = req.utilisateur.id;
    if (!nom) return res.status(400).json({ message: "Nom obligatoire." });

    await db.query(
      "UPDATE utilisateur SET nom=?, telephone=?, updated_at=NOW() WHERE id=?",
      [nom, telephone || null, userId]
    );
    const [[user]] = await db.query(
      "SELECT id,nom,email,telephone,statut,type FROM utilisateur WHERE id=?",
      [userId]
    );
    return res.status(200).json({ message: "Profil mis à jour.", user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// PUT /api/auth/changer-mot-de-passe — ProfilUtilisateur.jsx → changerMdp()
export const changerMotDePasse = async (req, res) => {
  try {
    const { actuel, nouveau, confirmer } = req.body;
    const userId = req.utilisateur.id;

    if (!actuel || !nouveau) return res.status(400).json({ message: "Tous les champs obligatoires." });
    if (nouveau !== confirmer) return res.status(400).json({ message: "Mots de passe différents." });
    if (nouveau.length < 6) return res.status(400).json({ message: "Minimum 6 caractères." });

    const [[user]] = await db.query("SELECT motDePasse FROM utilisateur WHERE id=?", [userId]);
    const valide = await bcrypt.compare(actuel, user.motDePasse);
    if (!valide) return res.status(401).json({ message: "Mot de passe actuel incorrect." });

    const hash = await bcrypt.hash(nouveau, 10);
    await db.query("UPDATE utilisateur SET motDePasse=?, updated_at=NOW() WHERE id=?", [hash, userId]);
    return res.status(200).json({ message: "Mot de passe modifié." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};