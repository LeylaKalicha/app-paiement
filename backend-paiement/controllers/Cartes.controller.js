import db from "../config/db.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

const genNumero = () =>
  Array.from({ length: 4 }, () => Math.floor(1000 + Math.random() * 9000)).join("");

const genCVV = () => String(Math.floor(100 + Math.random() * 900));

// Génère expiration : stocke "YYYY-MM-01" en SQL, retourne "MM/YY" pour le front
const genExpiration = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 3);
  return {
    sql:       `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
    affichage: `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`,
  };
};

// Formate une DATE MySQL "YYYY-MM-DD" → "MM/YY"
const fmtExpiration = (dateSQL) => {
  if (!dateSQL) return "—";
  const d = new Date(dateSQL);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/cartes/mes-cartes
// ═══════════════════════════════════════════════════════════════
export const getMesCartes = async (req, res) => {
  try {
    const userId = req.utilisateur.id;

    const [cartes] = await db.query(
      `SELECT id, numero, type, statut, dateExpiration, devise, design, solde, cvv
       FROM cartevirtuelle
       WHERE utilisateur_id = ?
       ORDER BY dateCreation DESC`,
      [userId]
    );

    const cartesFormatees = cartes.map((c) => ({
      id:             c.id,
      numero:         c.numero,
      type:           c.type   || "Mastercard",
      statut:         c.statut,
      dateExpiration: fmtExpiration(c.dateExpiration),
      devise:         c.devise || "XAF",
      design:         c.design || "violet",
      solde:          Number(c.solde || 0),
      cvv:            c.cvv,
    }));

    return res.status(200).json({ cartes: cartesFormatees });
  } catch (error) {
    console.error("Erreur getMesCartes :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  POST /api/cartes/creer
//  — Frais d'émission : 0 XAF (gratuit)
//  — Solde initial    : libre (0 minimum), débité du wallet
// ═══════════════════════════════════════════════════════════════
export const creerCarte = async (req, res) => {
  try {
    const userId = req.utilisateur.id;
    const { type, devise = "XAF", design = "violet", soldeInitial = 0 } = req.body;

    // ── Frais d'émission : 0 XAF (gratuit pour tous les types) ──
    const FRAIS_EMISSION = 0;

    // ── Solde initial : 0 minimum, libre ────────────────────────
    const soldeInitNum = Math.max(0, Number(soldeInitial) || 0);
    const typeFinal    = type || "Mastercard";
    const totalDebit   = FRAIS_EMISSION + soldeInitNum; // = soldeInitNum si frais=0

    // ── Vérifier solde wallet si solde initial > 0 ───────────────
    const [[compte]] = await db.query(
      "SELECT id, solde FROM compte WHERE utilisateur_id = ?",
      [userId]
    );
    if (!compte)
      return res.status(404).json({ message: "Compte wallet introuvable." });

    if (totalDebit > 0 && Number(compte.solde) < totalDebit)
      return res.status(400).json({
        message: `Solde wallet insuffisant. Disponible : ${Number(compte.solde).toLocaleString("fr-FR")} XAF. Requis : ${totalDebit.toLocaleString("fr-FR")} XAF.`,
      });

    // ── Max 5 cartes actives ─────────────────────────────────────
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM cartevirtuelle WHERE utilisateur_id = ? AND statut = 'ACTIVE'",
      [userId]
    );
    if (total >= 5)
      return res.status(400).json({ message: "Maximum 5 cartes actives atteint." });

    // ── Numéro unique (16 chiffres) ──────────────────────────────
    let numero = genNumero();
    let [existing] = await db.query(
      "SELECT id FROM cartevirtuelle WHERE numero = ?", [numero]
    );
    while (existing.length > 0) {
      numero = genNumero();
      [existing] = await db.query(
        "SELECT id FROM cartevirtuelle WHERE numero = ?", [numero]
      );
    }

    const cvv        = genCVV();
    const expiration = genExpiration();

    // ── Débiter le wallet uniquement si solde initial > 0 ────────
    if (totalDebit > 0) {
      await db.query(
        "UPDATE compte SET solde = solde - ?, updated_at = NOW() WHERE utilisateur_id = ?",
        [totalDebit, userId]
      );
    }

    // ── Créer la carte avec le solde initial ─────────────────────
    const [result] = await db.query(
      `INSERT INTO cartevirtuelle
         (utilisateur_id, numero, type, statut, dateExpiration, devise, design, cvv, solde, dateCreation)
       VALUES (?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?, NOW())`,
      [userId, numero, typeFinal, expiration.sql, devise, design, cvv, soldeInitNum]
    );

    // ── Enregistrer la transaction si débit effectif ─────────────
    if (totalDebit > 0) {
      await db.query(
        `INSERT INTO transaction (utilisateur_id, montant, statut, dateTransaction)
         VALUES (?, ?, 'VALIDEE', NOW())`,
        [userId, -totalDebit]
      );
    }

    // ── Notification ─────────────────────────────────────────────
    const msgNotif = totalDebit > 0
      ? `Votre carte ${typeFinal} a été créée. Solde initial crédité : ${soldeInitNum.toLocaleString("fr-FR")} XAF (émission gratuite).`
      : `Votre carte ${typeFinal} a été créée gratuitement. Rechargez-la quand vous voulez.`;

    await db.query(
      `INSERT INTO notification (utilisateur_id, titre, message, dateEnvoi)
       VALUES (?, 'Carte créée ✅', ?, NOW())`,
      [userId, msgNotif]
    );

    // ── Nouveau solde wallet ──────────────────────────────────────
    const [[compteMAJ]] = await db.query(
      "SELECT solde FROM compte WHERE utilisateur_id = ?", [userId]
    );

    return res.status(201).json({
      message: "Carte virtuelle créée avec succès.",
      carte: {
        id:             result.insertId,
        numero,
        type:           typeFinal,
        devise,
        design,
        cvv,
        dateExpiration: expiration.affichage,
        statut:         "ACTIVE",
        solde:          soldeInitNum,
      },
      fraisDebites:       FRAIS_EMISSION,
      soldeInitialCarte:  soldeInitNum,
      totalDebite:        totalDebit,
      nouveauSoldeWallet: Number(compteMAJ?.solde || 0),
    });
  } catch (error) {
    console.error("Erreur creerCarte :", error);
    if (error.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Numéro déjà existant, réessayez." });
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  PUT /api/cartes/:id/bloquer
// ═══════════════════════════════════════════════════════════════
export const bloquerCarte = async (req, res) => {
  try {
    const userId  = req.utilisateur.id;
    const carteId = req.params.id;

    const [[carte]] = await db.query(
      "SELECT id, statut FROM cartevirtuelle WHERE id = ? AND utilisateur_id = ?",
      [carteId, userId]
    );
    if (!carte)  return res.status(404).json({ message: "Carte introuvable." });
    if (carte.statut === "BLOQUEE")
      return res.status(400).json({ message: "Carte déjà bloquée." });

    await db.query(
      "UPDATE cartevirtuelle SET statut = 'BLOQUEE', updated_at = NOW() WHERE id = ?",
      [carteId]
    );
    return res.status(200).json({ message: "Carte bloquée avec succès." });
  } catch (error) {
    console.error("Erreur bloquerCarte :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  PUT /api/cartes/:id/debloquer
// ═══════════════════════════════════════════════════════════════
export const debloquerCarte = async (req, res) => {
  try {
    const userId  = req.utilisateur.id;
    const carteId = req.params.id;

    const [[carte]] = await db.query(
      "SELECT id, statut FROM cartevirtuelle WHERE id = ? AND utilisateur_id = ?",
      [carteId, userId]
    );
    if (!carte) return res.status(404).json({ message: "Carte introuvable." });
    if (carte.statut === "ACTIVE")
      return res.status(400).json({ message: "Carte déjà active." });

    await db.query(
      "UPDATE cartevirtuelle SET statut = 'ACTIVE', updated_at = NOW() WHERE id = ?",
      [carteId]
    );
    return res.status(200).json({ message: "Carte débloquée avec succès." });
  } catch (error) {
    console.error("Erreur debloquerCarte :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  DELETE /api/cartes/:id
// ═══════════════════════════════════════════════════════════════
export const supprimerCarte = async (req, res) => {
  try {
    const userId  = req.utilisateur.id;
    const carteId = req.params.id;

    const [[carte]] = await db.query(
      "SELECT id FROM cartevirtuelle WHERE id = ? AND utilisateur_id = ?",
      [carteId, userId]
    );
    if (!carte) return res.status(404).json({ message: "Carte introuvable." });

    await db.query("DELETE FROM cartevirtuelle WHERE id = ?", [carteId]);
    return res.status(200).json({ message: "Carte supprimée avec succès." });
  } catch (error) {
    console.error("Erreur supprimerCarte :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  POST /api/cartes/:id/recharger  — Wallet → Carte virtuelle
// ═══════════════════════════════════════════════════════════════
export const rechargerCarte = async (req, res) => {
  try {
    const userId  = req.utilisateur.id;
    const carteId = req.params.id;
    const { montant } = req.body;

    if (!montant || Number(montant) < 10)
      return res.status(400).json({ message: "Montant minimum : 10 XAF." });

    const montantNum = Number(montant);

    const [[carte]] = await db.query(
      "SELECT id, statut, solde FROM cartevirtuelle WHERE id = ? AND utilisateur_id = ?",
      [carteId, userId]
    );
    if (!carte)
      return res.status(404).json({ message: "Carte introuvable." });
    if (carte.statut !== "ACTIVE")
      return res.status(400).json({ message: "Impossible de recharger une carte bloquée." });

    const [[compte]] = await db.query(
      "SELECT id, solde FROM compte WHERE utilisateur_id = ?",
      [userId]
    );
    if (!compte)
      return res.status(404).json({ message: "Compte wallet introuvable." });
    if (Number(compte.solde) < montantNum)
      return res.status(400).json({
        message: `Solde wallet insuffisant. Disponible : ${Number(compte.solde).toLocaleString("fr-FR")} XAF.`,
      });

    // Débit wallet + Crédit carte
    await db.query(
      "UPDATE compte SET solde = solde - ?, updated_at = NOW() WHERE utilisateur_id = ?",
      [montantNum, userId]
    );
    await db.query(
      "UPDATE cartevirtuelle SET solde = solde + ?, updated_at = NOW() WHERE id = ?",
      [montantNum, carteId]
    );

    // Transaction + Notification
    const [txResult] = await db.query(
      `INSERT INTO transaction (utilisateur_id, montant, statut, dateTransaction)
       VALUES (?, ?, 'VALIDEE', NOW())`,
      [userId, -montantNum]
    );
    await db.query(
      `INSERT INTO notification (utilisateur_id, titre, message, dateEnvoi)
       VALUES (?, 'Carte rechargée', ?, NOW())`,
      [
        userId,
        `Votre carte virtuelle •••• ${String(carte.id).padStart(4, "0")} a été rechargée de ${montantNum.toLocaleString("fr-FR")} XAF.`,
      ]
    );

    const [[compteMAJ]] = await db.query(
      "SELECT solde FROM compte WHERE utilisateur_id = ?", [userId]
    );
    const [[carteMAJ]] = await db.query(
      "SELECT solde FROM cartevirtuelle WHERE id = ?", [carteId]
    );

    return res.status(200).json({
      message:            `✅ ${montantNum.toLocaleString("fr-FR")} XAF transférés vers votre carte virtuelle.`,
      transaction:        { id: txResult.insertId, montant: -montantNum, statut: "VALIDEE" },
      nouveauSoldeWallet: Number(compteMAJ?.solde || 0),
      nouveauSoldeCarte:  Number(carteMAJ?.solde  || 0),
    });
  } catch (error) {
    console.error("Erreur rechargerCarte :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};










// import db from "../config/db.js";

// // ─── Helpers ────────────────────────────────────────────────────────────────

// const genNumero = () =>
//   Array.from({ length: 4 }, () => Math.floor(1000 + Math.random() * 9000)).join("");

// const genCVV = () => String(Math.floor(100 + Math.random() * 900));

// // Génère expiration : stocke "YYYY-MM-01" en SQL, retourne "MM/YY" pour le front
// const genExpiration = () => {
//   const d = new Date();
//   d.setFullYear(d.getFullYear() + 3);
//   return {
//     sql:       `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
//     affichage: `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`,
//   };
// };

// // Formate une DATE MySQL "YYYY-MM-DD" → "MM/YY"
// const fmtExpiration = (dateSQL) => {
//   if (!dateSQL) return "—";
//   const d = new Date(dateSQL);
//   return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
// };

// // ═══════════════════════════════════════════════════════════════
// //  GET /api/cartes/mes-cartes
// // ═══════════════════════════════════════════════════════════════
// export const getMesCartes = async (req, res) => {
//   try {
//     const userId = req.utilisateur.id;

//     const [cartes] = await db.query(
//       `SELECT id, numero, type, statut, dateExpiration, devise, design, solde, cvv
//        FROM cartevirtuelle
//        WHERE utilisateur_id = ?
//        ORDER BY dateCreation DESC`,
//       [userId]
//     );

//     const cartesFormatees = cartes.map((c) => ({
//       id:             c.id,
//       numero:         c.numero,
//       type:           c.type   || "Mastercard",
//       statut:         c.statut,
//       dateExpiration: fmtExpiration(c.dateExpiration),
//       devise:         c.devise || "XAF",
//       design:         c.design || "violet",
//       solde:          Number(c.solde || 0),
//       cvv:            c.cvv,  // renvoyé au front, masqué par défaut dans l'UI
//     }));

//     return res.status(200).json({ cartes: cartesFormatees });
//   } catch (error) {
//     console.error("Erreur getMesCartes :", error);
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };

// // ═══════════════════════════════════════════════════════════════
// //  POST /api/cartes/creer
// // ═══════════════════════════════════════════════════════════════
// export const creerCarte = async (req, res) => {
//   try {
//     const userId = req.utilisateur.id;
//     const { type, devise = "XAF", design = "violet" } = req.body;

//     // Max 5 cartes actives
//     const [[{ total }]] = await db.query(
//       "SELECT COUNT(*) AS total FROM cartevirtuelle WHERE utilisateur_id = ? AND statut = 'ACTIVE'",
//       [userId]
//     );
//     if (total >= 5)
//       return res.status(400).json({ message: "Maximum 5 cartes actives atteint." });

//     // Numéro unique (16 chiffres sans espaces en BD)
//     let numero = genNumero();
//     let [existing] = await db.query(
//       "SELECT id FROM cartevirtuelle WHERE numero = ?", [numero]
//     );
//     while (existing.length > 0) {
//       numero = genNumero();
//       [existing] = await db.query(
//         "SELECT id FROM cartevirtuelle WHERE numero = ?", [numero]
//       );
//     }

//     const cvv        = genCVV();
//     const expiration = genExpiration();
//     const typeFinal  = type || "Mastercard";

//     const [result] = await db.query(
//       `INSERT INTO cartevirtuelle
//          (utilisateur_id, numero, type, statut, dateExpiration, devise, design, cvv, solde, dateCreation)
//        VALUES (?, ?, ?, 'ACTIVE', ?, ?, ?, ?, 0.00, NOW())`,
//       [userId, numero, typeFinal, expiration.sql, devise, design, cvv]
//     );

//     return res.status(201).json({
//       message: "Carte virtuelle créée avec succès.",
//       carte: {
//         id:             result.insertId,
//         numero,
//         type:           typeFinal,
//         devise,
//         design,
//         cvv,
//         dateExpiration: expiration.affichage,
//         statut:         "ACTIVE",
//         solde:          0,
//       },
//     });
//   } catch (error) {
//     console.error("Erreur creerCarte :", error);
//     if (error.code === "ER_DUP_ENTRY")
//       return res.status(409).json({ message: "Numéro déjà existant, réessayez." });
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };

// // ═══════════════════════════════════════════════════════════════
// //  PUT /api/cartes/:id/bloquer
// // ═══════════════════════════════════════════════════════════════
// export const bloquerCarte = async (req, res) => {
//   try {
//     const userId  = req.utilisateur.id;
//     const carteId = req.params.id;

//     const [[carte]] = await db.query(
//       "SELECT id, statut FROM cartevirtuelle WHERE id = ? AND utilisateur_id = ?",
//       [carteId, userId]
//     );
//     if (!carte)  return res.status(404).json({ message: "Carte introuvable." });
//     if (carte.statut === "BLOQUEE")
//       return res.status(400).json({ message: "Carte déjà bloquée." });

//     await db.query(
//       "UPDATE cartevirtuelle SET statut = 'BLOQUEE', updated_at = NOW() WHERE id = ?",
//       [carteId]
//     );
//     return res.status(200).json({ message: "Carte bloquée avec succès." });
//   } catch (error) {
//     console.error("Erreur bloquerCarte :", error);
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };

// // ═══════════════════════════════════════════════════════════════
// //  PUT /api/cartes/:id/debloquer
// // ═══════════════════════════════════════════════════════════════
// export const debloquerCarte = async (req, res) => {
//   try {
//     const userId  = req.utilisateur.id;
//     const carteId = req.params.id;

//     const [[carte]] = await db.query(
//       "SELECT id, statut FROM cartevirtuelle WHERE id = ? AND utilisateur_id = ?",
//       [carteId, userId]
//     );
//     if (!carte) return res.status(404).json({ message: "Carte introuvable." });
//     if (carte.statut === "ACTIVE")
//       return res.status(400).json({ message: "Carte déjà active." });

//     await db.query(
//       "UPDATE cartevirtuelle SET statut = 'ACTIVE', updated_at = NOW() WHERE id = ?",
//       [carteId]
//     );
//     return res.status(200).json({ message: "Carte débloquée avec succès." });
//   } catch (error) {
//     console.error("Erreur debloquerCarte :", error);
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };

// // ═══════════════════════════════════════════════════════════════
// //  DELETE /api/cartes/:id
// // ═══════════════════════════════════════════════════════════════
// export const supprimerCarte = async (req, res) => {
//   try {
//     const userId  = req.utilisateur.id;
//     const carteId = req.params.id;

//     const [[carte]] = await db.query(
//       "SELECT id FROM cartevirtuelle WHERE id = ? AND utilisateur_id = ?",
//       [carteId, userId]
//     );
//     if (!carte) return res.status(404).json({ message: "Carte introuvable." });

//     await db.query("DELETE FROM cartevirtuelle WHERE id = ?", [carteId]);
//     return res.status(200).json({ message: "Carte supprimée avec succès." });
//   } catch (error) {
//     console.error("Erreur supprimerCarte :", error);
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };

// // ═══════════════════════════════════════════════════════════════
// //  POST /api/cartes/:id/recharger  — Wallet → Carte virtuelle
// // ═══════════════════════════════════════════════════════════════
// export const rechargerCarte = async (req, res) => {
//   try {
//     const userId  = req.utilisateur.id;
//     const carteId = req.params.id;
//     const { montant } = req.body;

//     if (!montant || Number(montant) < 100)
//       return res.status(400).json({ message: "Montant minimum : 100 XAF." });

//     const montantNum = Number(montant);

//     const [[carte]] = await db.query(
//       "SELECT id, statut, solde FROM cartevirtuelle WHERE id = ? AND utilisateur_id = ?",
//       [carteId, userId]
//     );
//     if (!carte)
//       return res.status(404).json({ message: "Carte introuvable." });
//     if (carte.statut !== "ACTIVE")
//       return res.status(400).json({ message: "Impossible de recharger une carte bloquée." });

//     const [[compte]] = await db.query(
//       "SELECT id, solde FROM compte WHERE utilisateur_id = ?",
//       [userId]
//     );
//     if (!compte)
//       return res.status(404).json({ message: "Compte wallet introuvable." });
//     if (Number(compte.solde) < montantNum)
//       return res.status(400).json({
//         message: `Solde wallet insuffisant. Disponible : ${Number(compte.solde).toLocaleString("fr-FR")} XAF.`,
//       });

//     // Débit wallet + Crédit carte
//     await db.query(
//       "UPDATE compte SET solde = solde - ?, updated_at = NOW() WHERE utilisateur_id = ?",
//       [montantNum, userId]
//     );
//     await db.query(
//       "UPDATE cartevirtuelle SET solde = solde + ?, updated_at = NOW() WHERE id = ?",
//       [montantNum, carteId]
//     );

//     // Transaction + Notification
//     const [txResult] = await db.query(
//       `INSERT INTO transaction (utilisateur_id, montant, statut, dateTransaction)
//        VALUES (?, ?, 'VALIDEE', NOW())`,
//       [userId, -montantNum]
//     );
//     await db.query(
//       `INSERT INTO notification (utilisateur_id, titre, message, dateEnvoi)
//        VALUES (?, 'Carte rechargée', ?, NOW())`,
//       [
//         userId,
//         `Votre carte virtuelle •••• ${String(carte.id).padStart(4, "0")} a été rechargée de ${montantNum.toLocaleString("fr-FR")} XAF.`,
//       ]
//     );

//     const [[compteMAJ]] = await db.query(
//       "SELECT solde FROM compte WHERE utilisateur_id = ?", [userId]
//     );
//     const [[carteMAJ]] = await db.query(
//       "SELECT solde FROM cartevirtuelle WHERE id = ?", [carteId]
//     );

//     return res.status(200).json({
//       message:            `✅ ${montantNum.toLocaleString("fr-FR")} XAF transférés vers votre carte virtuelle.`,
//       transaction:        { id: txResult.insertId, montant: -montantNum, statut: "VALIDEE" },
//       nouveauSoldeWallet: Number(compteMAJ?.solde || 0),
//       nouveauSoldeCarte:  Number(carteMAJ?.solde  || 0),
//     });
//   } catch (error) {
//     console.error("Erreur rechargerCarte :", error);
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };











// // import db from "../config/db.js";

// // const genNumero    = () => { const p=()=>Math.floor(1000+Math.random()*9000); return `${p()}${p()}${p()}${p()}`; };
// // const genCVV       = () => String(Math.floor(100+Math.random()*900));
// // const genExpiration= () => { const d=new Date(); d.setFullYear(d.getFullYear()+3); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; };
// // const fmtDate      = (d) => { if(!d) return "—"; const dt=new Date(d); return `${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getFullYear()).slice(-2)}`; };
// // const fmtNumero    = (n) => n?.replace(/(\d{4})(?=\d)/g,"$1 ")||"";

// // // GET /api/cartes/mes-cartes
// // export const getMesCartes = async (req, res) => {
// //   try {
// //     const [cartes] = await db.query(
// //       "SELECT id,numero,dateExpiration,statut,created_at FROM cartevirtuelle WHERE utilisateur_id=? ORDER BY created_at DESC",
// //       [req.utilisateur.id]
// //     );
// //     return res.status(200).json({
// //       cartes: cartes.map(c=>({ id:c.id, numero:c.numero, numeroAffiche:fmtNumero(c.numero), dateExpiration:fmtDate(c.dateExpiration), cvv:"***", statut:c.statut })),
// //       total: cartes.length
// //     });
// //   } catch(err){ console.error(err); return res.status(500).json({message:"Erreur serveur."}); }
// // };

// // // POST /api/cartes/creer
// // export const creerCarte = async (req, res) => {
// //   try {
// //     const [[{total}]] = await db.query(
// //       "SELECT COUNT(*) AS total FROM cartevirtuelle WHERE utilisateur_id=? AND statut='ACTIVE'",
// //       [req.utilisateur.id]
// //     );
// //     if(total>=5) return res.status(400).json({message:"Maximum 5 cartes actives atteint."});

// //     const numero=genNumero(), cvv=genCVV(), dateExpiration=genExpiration();
// //     const [result] = await db.query(
// //       "INSERT INTO cartevirtuelle (numero,dateExpiration,cvv,statut,utilisateur_id) VALUES (?,?,?,'ACTIVE',?)",
// //       [numero, dateExpiration, cvv, req.utilisateur.id]
// //     );
// //     return res.status(201).json({
// //       message:"Carte créée !",
// //       carte:{ id:result.insertId, numero, numeroAffiche:fmtNumero(numero), dateExpiration:fmtDate(dateExpiration), cvv, statut:"ACTIVE" }
// //     });
// //   } catch(err){
// //     if(err.code==="ER_DUP_ENTRY") return res.status(409).json({message:"Réessayez."});
// //     console.error(err); return res.status(500).json({message:"Erreur serveur."});
// //   }
// // };

// // // PUT /api/cartes/:id/bloquer
// // export const bloquerCarte = async (req, res) => {
// //   try {
// //     const [[c]] = await db.query("SELECT id,statut FROM cartevirtuelle WHERE id=? AND utilisateur_id=?",[req.params.id,req.utilisateur.id]);
// //     if(!c) return res.status(404).json({message:"Carte introuvable."});
// //     if(c.statut==="BLOQUEE") return res.status(400).json({message:"Déjà bloquée."});
// //     await db.query("UPDATE cartevirtuelle SET statut='BLOQUEE',updated_at=NOW() WHERE id=?",[req.params.id]);
// //     return res.status(200).json({message:"Carte bloquée."});
// //   } catch(err){ console.error(err); return res.status(500).json({message:"Erreur serveur."}); }
// // };

// // // PUT /api/cartes/:id/debloquer
// // export const debloquerCarte = async (req, res) => {
// //   try {
// //     const [[c]] = await db.query("SELECT id FROM cartevirtuelle WHERE id=? AND utilisateur_id=?",[req.params.id,req.utilisateur.id]);
// //     if(!c) return res.status(404).json({message:"Carte introuvable."});
// //     await db.query("UPDATE cartevirtuelle SET statut='ACTIVE',updated_at=NOW() WHERE id=?",[req.params.id]);
// //     return res.status(200).json({message:"Carte débloquée."});
// //   } catch(err){ console.error(err); return res.status(500).json({message:"Erreur serveur."}); }
// // };

// // // DELETE /api/cartes/:id
// // export const supprimerCarte = async (req, res) => {
// //   try {
// //     const [[c]] = await db.query("SELECT id FROM cartevirtuelle WHERE id=? AND utilisateur_id=?",[req.params.id,req.utilisateur.id]);
// //     if(!c) return res.status(404).json({message:"Carte introuvable."});
// //     await db.query("DELETE FROM cartevirtuelle WHERE id=?",[req.params.id]);
// //     return res.status(200).json({message:"Carte supprimée."});
// //   } catch(err){ console.error(err); return res.status(500).json({message:"Erreur serveur."}); }
// // };











// import db from "../config/db.js";

// // ═══════════════════════════════════════════════════════════════
// //  GET /api/cartes/mes-cartes
// // ═══════════════════════════════════════════════════════════════
// export const getMesCartes = async (req, res) => {
//   try {
//     const userId = req.utilisateur.id;
//     const [cartes] = await db.query(
//       `SELECT id, numero, type, statut, dateExpiration, devise, design, solde
//        FROM cartevirtuelle
//        WHERE utilisateur_id = ?
//        ORDER BY dateCreation DESC`,
//       [userId]
//     );
//     return res.status(200).json({ cartes });
//   } catch (error) {
//     console.error("Erreur getMesCartes :", error);
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };

// // ═══════════════════════════════════════════════════════════════
// //  POST /api/cartes/creer
// // ═══════════════════════════════════════════════════════════════
// export const creerCarte = async (req, res) => {
//   try {
//     const userId = req.utilisateur.id;
//     const { type, devise = "XAF", design = "violet" } = req.body;

//     // Générer un numéro de carte virtuel (16 chiffres)
//     const numero = Array.from({ length: 4 }, () =>
//       Math.floor(1000 + Math.random() * 9000)
//     ).join(" ");

//     const dateExpiration = (() => {
//       const d = new Date();
//       d.setFullYear(d.getFullYear() + 3);
//       return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
//     })();

//     const cvv = String(Math.floor(100 + Math.random() * 900));

//     const [result] = await db.query(
//       `INSERT INTO cartevirtuelle
//          (utilisateur_id, numero, type, statut, dateExpiration, devise, design, cvv, solde, dateCreation)
//        VALUES (?, ?, ?, 'ACTIVE', ?, ?, ?, ?, 0, NOW())`,
//       [userId, numero.replace(/ /g, ""), type || "Mastercard", dateExpiration, devise, design, cvv]
//     );

//     return res.status(201).json({
//       message: "Carte virtuelle créée avec succès.",
//       carteId: result.insertId,
//       numero, dateExpiration, cvv, type, devise,
//     });
//   } catch (error) {
//     console.error("Erreur creerCarte :", error);
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };

// // ═══════════════════════════════════════════════════════════════
// //  PUT /api/cartes/:id/bloquer
// // ═══════════════════════════════════════════════════════════════
// export const bloquerCarte = async (req, res) => {
//   try {
//     const userId  = req.utilisateur.id;
//     const carteId = req.params.id;

//     const [[carte]] = await db.query(
//       "SELECT id, statut FROM cartevirtuelle WHERE id = ? AND utilisateur_id = ?",
//       [carteId, userId]
//     );
//     if (!carte) return res.status(404).json({ message: "Carte introuvable." });
//     if (carte.statut === "BLOQUEE") return res.status(400).json({ message: "Carte déjà bloquée." });

//     await db.query(
//       "UPDATE cartevirtuelle SET statut = 'BLOQUEE', updated_at = NOW() WHERE id = ?",
//       [carteId]
//     );
//     return res.status(200).json({ message: "Carte bloquée avec succès." });
//   } catch (error) {
//     console.error("Erreur bloquerCarte :", error);
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };

// // ═══════════════════════════════════════════════════════════════
// //  PUT /api/cartes/:id/debloquer
// // ═══════════════════════════════════════════════════════════════
// export const debloquerCarte = async (req, res) => {
//   try {
//     const userId  = req.utilisateur.id;
//     const carteId = req.params.id;

//     const [[carte]] = await db.query(
//       "SELECT id, statut FROM cartevirtuelle WHERE id = ? AND utilisateur_id = ?",
//       [carteId, userId]
//     );
//     if (!carte) return res.status(404).json({ message: "Carte introuvable." });
//     if (carte.statut === "ACTIVE") return res.status(400).json({ message: "Carte déjà active." });

//     await db.query(
//       "UPDATE cartevirtuelle SET statut = 'ACTIVE', updated_at = NOW() WHERE id = ?",
//       [carteId]
//     );
//     return res.status(200).json({ message: "Carte débloquée avec succès." });
//   } catch (error) {
//     console.error("Erreur debloquerCarte :", error);
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };

// // ═══════════════════════════════════════════════════════════════
// //  DELETE /api/cartes/:id
// // ═══════════════════════════════════════════════════════════════
// export const supprimerCarte = async (req, res) => {
//   try {
//     const userId  = req.utilisateur.id;
//     const carteId = req.params.id;

//     const [[carte]] = await db.query(
//       "SELECT id FROM cartevirtuelle WHERE id = ? AND utilisateur_id = ?",
//       [carteId, userId]
//     );
//     if (!carte) return res.status(404).json({ message: "Carte introuvable." });

//     await db.query("DELETE FROM cartevirtuelle WHERE id = ?", [carteId]);
//     return res.status(200).json({ message: "Carte supprimée." });
//   } catch (error) {
//     console.error("Erreur supprimerCarte :", error);
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };

// // ═══════════════════════════════════════════════════════════════
// //  POST /api/cartes/:id/recharger  — Wallet → Carte virtuelle
// //  Scénario : MTN MoMo → Wallet PayVirtual → Carte virtuelle
// // ═══════════════════════════════════════════════════════════════
// export const rechargerCarte = async (req, res) => {
//   try {
//     const userId  = req.utilisateur.id;
//     const carteId = req.params.id;
//     const { montant } = req.body;

//     if (!montant || Number(montant) < 100)
//       return res.status(400).json({ message: "Montant minimum : 100 XAF." });

//     const montantNum = Number(montant);

//     // Vérifier que la carte appartient à l'utilisateur et est active
//     const [[carte]] = await db.query(
//       "SELECT id, statut, solde FROM cartevirtuelle WHERE id = ? AND utilisateur_id = ?",
//       [carteId, userId]
//     );
//     if (!carte) return res.status(404).json({ message: "Carte introuvable." });
//     if (carte.statut !== "ACTIVE")
//       return res.status(400).json({ message: "Impossible de recharger une carte bloquée." });

//     // Vérifier le solde wallet
//     const [[compte]] = await db.query(
//       "SELECT id, solde FROM compte WHERE utilisateur_id = ?", [userId]
//     );
//     if (!compte) return res.status(404).json({ message: "Compte introuvable." });
//     if (Number(compte.solde) < montantNum)
//       return res.status(400).json({
//         message: `Solde wallet insuffisant. Disponible : ${Number(compte.solde).toLocaleString("fr-FR")} XAF.`,
//       });

//     // Débit wallet
//     await db.query(
//       "UPDATE compte SET solde = solde - ?, updated_at = NOW() WHERE utilisateur_id = ?",
//       [montantNum, userId]
//     );

//     // Crédit carte virtuelle
//     await db.query(
//       "UPDATE cartevirtuelle SET solde = solde + ?, updated_at = NOW() WHERE id = ?",
//       [montantNum, carteId]
//     );

//     // Enregistrer la transaction
//     const [txResult] = await db.query(
//       `INSERT INTO transaction (utilisateur_id, montant, statut, dateTransaction)
//        VALUES (?, ?, 'VALIDEE', NOW())`,
//       [userId, -montantNum]
//     );

//     // Notification
//     await db.query(
//       `INSERT INTO notification (utilisateur_id, titre, message, type, dateCreation)
//        VALUES (?, 'Carte rechargée', ?, 'CREDIT', NOW())`,
//       [userId, `Votre carte virtuelle •••• ${String(carte.id).padStart(4, "0")} a été rechargée de ${montantNum.toLocaleString("fr-FR")} XAF.`]
//     );

//     const [[compteMAJ]] = await db.query(
//       "SELECT solde FROM compte WHERE utilisateur_id = ?", [userId]
//     );
//     const [[carteMAJ]] = await db.query(
//       "SELECT solde FROM cartevirtuelle WHERE id = ?", [carteId]
//     );

//     return res.status(200).json({
//       message:          `✅ ${montantNum.toLocaleString("fr-FR")} XAF transférés du wallet vers votre carte virtuelle.`,
//       transaction:      { id: txResult.insertId, montant: -montantNum, statut: "VALIDEE" },
//       nouveauSoldeWallet: compteMAJ?.solde || 0,
//       nouveauSoldeCarte:  carteMAJ?.solde || 0,
//     });

//   } catch (error) {
//     console.error("Erreur rechargerCarte :", error);
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };