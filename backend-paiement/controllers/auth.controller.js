
// import db from "../config/db.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// // ═══════════════════════════════════════════════════════════════
// //  POST /api/auth/register
// //  ✅ FIX : Crée automatiquement le compte wallet après inscription
// // ═══════════════════════════════════════════════════════════════
// export const register = async (req, res) => {
//   try {
//     const { nom, prenom, email, telephone, motDePasse, pays } = req.body;

//     if (!nom || !email || !motDePasse)
//       return res.status(400).json({ message: "Nom, email et mot de passe obligatoires." });

//     // Vérifier si l'email existe déjà
//     const [[existant]] = await db.query(
//       "SELECT id FROM utilisateur WHERE email = ?", [email]
//     );
//     if (existant)
//       return res.status(409).json({ message: "Cet email est déjà utilisé." });

//     // Hasher le mot de passe
//     const motDePasseHash = await bcrypt.hash(motDePasse, 12);

//     // Créer l'utilisateur
//     const [result] = await db.query(
//       `INSERT INTO utilisateur (nom, prenom, email, telephone, motDePasse, pays, statut, dateCreation)
//        VALUES (?, ?, ?, ?, ?, ?, 'ACTIF', NOW())`,
//       [nom, prenom || "", email, telephone || "", motDePasseHash, pays || "Cameroun"]
//     );
//     const userId = result.insertId;

//     // ✅ Créer automatiquement le compte wallet avec solde initial 0
//     await db.query(
//       "INSERT INTO compte (utilisateur_id, solde, dateCreation) VALUES (?, 0.00, NOW())",
//       [userId]
//     );

//     // Notification de bienvenue
//     await db.query(
//       `INSERT INTO notification (utilisateur_id, titre, message, type, dateCreation)
//        VALUES (?, 'Bienvenue sur PayVirtual ! 🎉', ?, 'INFO', NOW())`,
//       [userId, `Bonjour ${prenom || nom}, votre compte PayVirtual est prêt. Effectuez votre premier dépôt pour commencer !`]
//     );

//     console.log(`✅ Nouvel utilisateur créé : ${email} (id=${userId}) + compte wallet`);

//     return res.status(201).json({
//       message: "Compte créé avec succès ! Vous pouvez maintenant vous connecter.",
//       userId,
//     });
//   } catch (error) {
//     console.error("Erreur register :", error);
//     return res.status(500).json({ message: "Erreur serveur lors de l'inscription." });
//   }
// };

// // ═══════════════════════════════════════════════════════════════
// //  POST /api/auth/login
// // ═══════════════════════════════════════════════════════════════
// export const login = async (req, res) => {
//   try {
//     const { email, motDePasse } = req.body;

//     if (!email || !motDePasse)
//       return res.status(400).json({ message: "Email et mot de passe obligatoires." });

//     const [[utilisateur]] = await db.query(
//       "SELECT id, nom, prenom, email, telephone, motDePasse, statut FROM utilisateur WHERE email = ?",
//       [email]
//     );

//     if (!utilisateur)
//       return res.status(401).json({ message: "Email ou mot de passe incorrect." });
//     if (utilisateur.statut !== "ACTIF")
//       return res.status(403).json({ message: "Compte suspendu. Contactez le support." });

//     const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
//     if (!motDePasseValide)
//       return res.status(401).json({ message: "Email ou mot de passe incorrect." });

//     // ✅ Créer le compte wallet si absent (sécurité pour anciens utilisateurs)
//     const [[compte]] = await db.query(
//       "SELECT id FROM compte WHERE utilisateur_id = ?", [utilisateur.id]
//     );
//     if (!compte) {
//       await db.query(
//         "INSERT INTO compte (utilisateur_id, solde, dateCreation) VALUES (?, 0.00, NOW())",
//         [utilisateur.id]
//       );
//     }

//     const token = jwt.sign(
//       { id: utilisateur.id, email: utilisateur.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     const { motDePasse: _, ...userSansMotDePasse } = utilisateur;

//     return res.status(200).json({
//       message: "Connexion réussie.",
//       token,
//       user: userSansMotDePasse,
//     });
//   } catch (error) {
//     console.error("Erreur login :", error);
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };

// // ═══════════════════════════════════════════════════════════════
// //  POST /api/auth/changer-mot-de-passe
// // ═══════════════════════════════════════════════════════════════
// export const changerMotDePasse = async (req, res) => {
//   try {
//     const userId = req.utilisateur.id;
//     const { ancienMotDePasse, nouveauMotDePasse } = req.body;

//     if (!ancienMotDePasse || !nouveauMotDePasse)
//       return res.status(400).json({ message: "Ancien et nouveau mot de passe requis." });
//     if (nouveauMotDePasse.length < 6)
//       return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 6 caractères." });

//     const [[utilisateur]] = await db.query(
//       "SELECT motDePasse FROM utilisateur WHERE id = ?", [userId]
//     );
//     const valide = await bcrypt.compare(ancienMotDePasse, utilisateur.motDePasse);
//     if (!valide)
//       return res.status(401).json({ message: "Ancien mot de passe incorrect." });

//     const hash = await bcrypt.hash(nouveauMotDePasse, 12);
//     await db.query(
//       "UPDATE utilisateur SET motDePasse = ? WHERE id = ?", [hash, userId]
//     );

//     return res.status(200).json({ message: "Mot de passe modifié avec succès." });
//   } catch (error) {
//     console.error("Erreur changerMotDePasse :", error);
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };

// // ═══════════════════════════════════════════════════════════════
// //  PUT /api/auth/profil  — Modifier les infos personnelles
// // ═══════════════════════════════════════════════════════════════
// export const modifierProfil = async (req, res) => {
//   try {
//     const userId = req.utilisateur.id;
//     const { nom, prenom, telephone, pays } = req.body;

//     await db.query(
//       `UPDATE utilisateur SET
//          nom       = COALESCE(?, nom),
//          prenom    = COALESCE(?, prenom),
//          telephone = COALESCE(?, telephone),
//          pays      = COALESCE(?, pays)
//        WHERE id = ?`,
//       [nom, prenom, telephone, pays, userId]
//     );

//     const [[user]] = await db.query(
//       "SELECT id, nom, prenom, email, telephone, pays FROM utilisateur WHERE id = ?",
//       [userId]
//     );

//     return res.status(200).json({ message: "Profil mis à jour.", user });
//   } catch (error) {
//     console.error("Erreur modifierProfil :", error);
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };

// // ═══════════════════════════════════════════════════════════════
// //  DELETE /api/auth/supprimer-compte  — Fermeture du compte
// // ═══════════════════════════════════════════════════════════════
// export const supprimerCompte = async (req, res) => {
//   try {
//     const userId = req.utilisateur.id;
//     const { motDePasse } = req.body;

//     if (!motDePasse)
//       return res.status(400).json({ message: "Mot de passe requis pour confirmer la suppression." });

//     const [[utilisateur]] = await db.query(
//       "SELECT motDePasse FROM utilisateur WHERE id = ?", [userId]
//     );
//     const valide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
//     if (!valide)
//       return res.status(401).json({ message: "Mot de passe incorrect." });

//     // Soft delete — marquer comme SUPPRIME
//     await db.query(
//       "UPDATE utilisateur SET statut = 'SUPPRIME', email = CONCAT(email, '_supprime_', NOW()) WHERE id = ?",
//       [userId]
//     );
//     await db.query("UPDATE compte SET solde = 0 WHERE utilisateur_id = ?", [userId]);

//     return res.status(200).json({ message: "Compte supprimé avec succès." });
//   } catch (error) {
//     console.error("Erreur supprimerCompte :", error);
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };


// // ═══════════════════════════════════════════════════════════════
// //  MOT DE PASSE OUBLIÉ
// // ═══════════════════════════════════════════════════════════════
// export const motDePasseOublie = async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ message: "Email obligatoire." });
//     }

//     const [rows] = await db.query(
//       "SELECT id FROM utilisateur WHERE email = ?",
//       [email]
//     );

//     if (rows.length === 0) {
//       return res.status(200).json({ message: "Si cet email existe, un lien de réinitialisation a été envoyé." });
//     }

//     const resetToken = jwt.sign(
//       { id: rows[0].id, email },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     // TODO: envoyer par email avec nodemailer
//     console.log("Reset token :", resetToken);

//     return res.status(200).json({
//       message: "Si cet email existe, un lien de réinitialisation a été envoyé.",
//     });

//   } catch (error) {
//     console.error("Erreur motDePasseOublie :", error);
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };


// // ═══════════════════════════════════════════════════════════════
// //  RÉINITIALISER LE MOT DE PASSE
// // ═══════════════════════════════════════════════════════════════
// export const reinitialiserMotDePasse = async (req, res) => {
//   try {
//     const { token, nouveauMotDePasse } = req.body;

//     if (!token || !nouveauMotDePasse) {
//       return res.status(400).json({ message: "Token et nouveau mot de passe obligatoires." });
//     }

//     if (nouveauMotDePasse.length < 6) {
//       return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères." });
//     }

//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch {
//       return res.status(401).json({ message: "Token invalide ou expiré." });
//     }

//     const motDePasseHache = await bcrypt.hash(nouveauMotDePasse, 10);
//     await db.query(
//       "UPDATE utilisateur SET motDePasse = ? WHERE id = ?",
//       [motDePasseHache, decoded.id]
//     );

//     return res.status(200).json({ message: "Mot de passe réinitialisé avec succès." });

//   } catch (error) {
//     console.error("Erreur reinitialiserMotDePasse :", error);
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };























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

const userId = result.insertId;

// ✅ Créer automatiquement le compte wallet avec solde initial 0
    await db.query(
      "INSERT INTO compte (utilisateur_id, solde, dateCreation) VALUES (?, 0.00, NOW())",
      [userId]
    );

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

