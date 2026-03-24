import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ═══════════════════════════════════════════════════════════════
//  INSCRIPTION
// ═══════════════════════════════════════════════════════════════
export const register = async (req, res) => {
  try {
    const { nom, email, motDePasse, telephone } = req.body;

    // ── Validation des champs obligatoires ──
    if (!nom || !email || !motDePasse) {
      return res.status(400).json({ message: "Nom, email et mot de passe sont obligatoires." });
    }

    // ── Vérifier si l'email existe déjà ──
    const [existe] = await db.query(
      "SELECT id FROM utilisateur WHERE email = ?",
      [email]
    );
    if (existe.length > 0) {
      return res.status(409).json({ message: "Cet email est déjà utilisé." });
    }

    // ── Hachage du mot de passe ──
    const motDePasseHache = await bcrypt.hash(motDePasse, 10);

    // ── Insertion dans la base de données ──
    const [result] = await db.query(
      `INSERT INTO utilisateur (nom, email, motDePasse, telephone, statut, type)
       VALUES (?, ?, ?, ?, 'ACTIF', 'USER')`,
      [nom, email, motDePasseHache, telephone || null]
    );

    return res.status(201).json({
      message: "Inscription réussie.",
      utilisateur: {
        id:        result.insertId,
        nom,
        email,
        telephone: telephone || null,
        statut:    "ACTIF",
        type:      "USER",
      },
    });

  } catch (error) {
    console.error("Erreur register :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  CONNEXION
// ═══════════════════════════════════════════════════════════════
export const login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    // ── Validation des champs ──
    if (!email || !motDePasse) {
      return res.status(400).json({ message: "Email et mot de passe sont obligatoires." });
    }

    // ── Chercher l'utilisateur par email ──
    const [rows] = await db.query(
      "SELECT * FROM utilisateur WHERE email = ?",
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    const utilisateur = rows[0];

    // ── Vérifier si le compte est actif ──
    if (utilisateur.statut === "SUSPENDU") {
      return res.status(403).json({ message: "Votre compte est suspendu. Contactez l'administrateur." });
    }
    if (utilisateur.statut === "INACTIF") {
      return res.status(403).json({ message: "Votre compte est inactif." });
    }

    // ── Vérifier le mot de passe ──
    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    if (!motDePasseValide) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    // ── Générer le token JWT ──
    const token = jwt.sign(
      {
        id:    utilisateur.id,
        email: utilisateur.email,
        type:  utilisateur.type,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    // ── Réponse sans le mot de passe ──
    const { motDePasse: _, ...userSansMotDePasse } = utilisateur;

    return res.status(200).json({
      message: "Connexion réussie.",
      token,
      user: userSansMotDePasse,
    });

  } catch (error) {
    console.error("Erreur login :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  MOT DE PASSE OUBLIÉ
// ═══════════════════════════════════════════════════════════════
export const motDePasseOublie = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email obligatoire." });
    }

    const [rows] = await db.query(
      "SELECT id FROM utilisateur WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(200).json({ message: "Si cet email existe, un lien de réinitialisation a été envoyé." });
    }

    const resetToken = jwt.sign(
      { id: rows[0].id, email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // TODO: envoyer par email avec nodemailer
    console.log("Reset token :", resetToken);

    return res.status(200).json({
      message: "Si cet email existe, un lien de réinitialisation a été envoyé.",
    });

  } catch (error) {
    console.error("Erreur motDePasseOublie :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  RÉINITIALISER LE MOT DE PASSE
// ═══════════════════════════════════════════════════════════════
export const reinitialiserMotDePasse = async (req, res) => {
  try {
    const { token, nouveauMotDePasse } = req.body;

    if (!token || !nouveauMotDePasse) {
      return res.status(400).json({ message: "Token et nouveau mot de passe obligatoires." });
    }

    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Token invalide ou expiré." });
    }

    const motDePasseHache = await bcrypt.hash(nouveauMotDePasse, 10);
    await db.query(
      "UPDATE utilisateur SET motDePasse = ? WHERE id = ?",
      [motDePasseHache, decoded.id]
    );

    return res.status(200).json({ message: "Mot de passe réinitialisé avec succès." });

  } catch (error) {
    console.error("Erreur reinitialiserMotDePasse :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  PROFIL (utilisateur connecté)
// ═══════════════════════════════════════════════════════════════
export const getProfil = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nom, email, telephone, statut, type, created_at FROM utilisateur WHERE id = ?",
      [req.utilisateur.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    return res.status(200).json({ utilisateur: rows[0] });

  } catch (error) {
    console.error("Erreur getProfil :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};