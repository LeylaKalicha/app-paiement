import db from "../config/db.js";
import { collecterPaiementCamPay, verifierStatutCamPay } from "../services/campay.service.js";

// ═══════════════════════════════════════════════════════════════
//  GET /api/transactions/mes-transactions
// ═══════════════════════════════════════════════════════════════
export const getMesTransactions = async (req, res) => {
  try {
    const userId = req.utilisateur.id;

    const [transactions] = await db.query(
      `SELECT t.id, t.montant, t.statut, t.dateTransaction,
              tr.type AS typeTransfert, tr.paysSource, tr.paysDestination
       FROM transaction t
       LEFT JOIN transfert tr ON tr.transaction_id = t.id
       WHERE t.utilisateur_id = ?
       ORDER BY t.dateTransaction DESC LIMIT 50`,
      [userId]
    );

    return res.status(200).json({ transactions });

  } catch (error) {
    console.error("Erreur getMesTransactions :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  POST /api/transactions/topup
// ═══════════════════════════════════════════════════════════════
export const topUp = async (req, res) => {
  try {
    const userId = req.utilisateur.id;
    const { montant, telephone } = req.body;

    if (!montant || !telephone) {
      return res.status(400).json({ message: "Montant et téléphone obligatoires." });
    }
    if (Number(montant) < 1) {
      return res.status(400).json({ message: "Montant minimum : 1 XAF." });
    }

    const [[compte]] = await db.query(
      "SELECT id FROM compte WHERE utilisateur_id = ?", [userId]
    );
    if (!compte) return res.status(404).json({ message: "Compte introuvable." });

    const [txResult] = await db.query(
      `INSERT INTO transaction (utilisateur_id, montant, statut, dateTransaction)
       VALUES (?, ?, 'EN_ATTENTE', NOW())`,
      [userId, Math.abs(Number(montant))]
    );

    const transactionId = txResult.insertId;
    const reference     = `TOPUP-${transactionId}-${Date.now()}`;
    const numeroNettoye = telephone.replace(/[\s+\-()]/g, "");

    try {
      const campayResult = await collecterPaiementCamPay({
        montant:     Number(montant),
        telephone:   numeroNettoye,
        description: "Recharge SwiftCard",
        reference,
      });

      return res.status(200).json({
        message:     "Demande envoyée ! Confirmez sur votre téléphone.",
        transaction: { id: transactionId, statut: "EN_ATTENTE" },
        ussd_code:   campayResult.ussd_code || null,
        reference,
      });

    } catch (campayError) {
      await db.query(
        "UPDATE transaction SET statut = 'ANNULEE' WHERE id = ?",
        [transactionId]
      );
      return res.status(500).json({
        message: campayError.response?.data?.message || "Erreur CamPay.",
      });
    }

  } catch (error) {
    console.error("Erreur topUp :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  POST /api/transactions/transfert
// ═══════════════════════════════════════════════════════════════
export const transfert = async (req, res) => {
  try {
    const userId = req.utilisateur.id;
    const { montant, type, nomBeneficiaire, numeroCompte, banque, paysSrc, paysDest, raison } = req.body;

    if (!montant || !nomBeneficiaire) {
      return res.status(400).json({ message: "Montant et bénéficiaire obligatoires." });
    }

    const montantNum = Math.abs(Number(montant));

    // Vérifier le solde de l'expéditeur
    const [[compteExpediteur]] = await db.query(
      "SELECT id, solde FROM compte WHERE utilisateur_id = ?",
      [userId]
    );

    if (!compteExpediteur) {
      return res.status(404).json({ message: "Compte introuvable." });
    }

    if (Number(compteExpediteur.solde) < montantNum) {
      return res.status(400).json({
        message: `Solde insuffisant. Votre solde : ${Number(compteExpediteur.solde).toLocaleString("fr-FR")} XAF`,
      });
    }

    // ══════════════════════════════════════
    //  CAS 1 : PORTEFEUILLE SWIFTCARD
    // ══════════════════════════════════════
    if (type === "wallet") {

      const emailDestinataire = numeroCompte;
      console.log("=== DEBUG WALLET ===");
      console.log("Email destinataire :", emailDestinataire);
      console.log("Montant :", montantNum);
      console.log("UserId expéditeur :", userId);

      if (!emailDestinataire) {
        return res.status(400).json({ message: "Email du destinataire obligatoire." });
      }

      // Trouver le destinataire
      const [[destinataire]] = await db.query(
        "SELECT id, nom, email FROM utilisateur WHERE email = ? AND statut = 'ACTIF'",
        [emailDestinataire]
      );

      console.log("Destinataire trouvé :", destinataire);

      if (!destinataire) {
        return res.status(404).json({
          message: `Aucun utilisateur trouvé pour : ${emailDestinataire}`,
        });
      }

      if (destinataire.id === userId) {
        return res.status(400).json({ message: "Vous ne pouvez pas vous envoyer de l'argent." });
      }

      // Vérifier que le destinataire a un compte
      const [[compteDestinataire]] = await db.query(
        "SELECT id, solde FROM compte WHERE utilisateur_id = ?",
        [destinataire.id]
      );

      console.log("Compte destinataire :", compteDestinataire);

      if (!compteDestinataire) {
        return res.status(404).json({
          message: `${destinataire.nom} n'a pas de compte. Contactez le support.`,
        });
      }

      // DÉBIT expéditeur
      const [debitResult] = await db.query(
        "UPDATE compte SET solde = solde - ?, updated_at = NOW() WHERE utilisateur_id = ?",
        [montantNum, userId]
      );
      console.log("Débit lignes affectées :", debitResult.affectedRows);

      // CRÉDIT destinataire
      const [creditResult] = await db.query(
        "UPDATE compte SET solde = solde + ?, updated_at = NOW() WHERE utilisateur_id = ?",
        [montantNum, destinataire.id]
      );
      console.log("Crédit lignes affectées :", creditResult.affectedRows);

      // Transaction expéditeur
      const [txDebit] = await db.query(
        `INSERT INTO transaction (utilisateur_id, montant, statut, dateTransaction)
         VALUES (?, ?, 'VALIDEE', NOW())`,
        [userId, -montantNum]
      );

      // Transaction destinataire
      await db.query(
        `INSERT INTO transaction (utilisateur_id, montant, statut, dateTransaction)
         VALUES (?, ?, 'VALIDEE', NOW())`,
        [destinataire.id, montantNum]
      );

      // Transfert
      await db.query(
        `INSERT INTO transfert (type, paysSource, paysDestination, transaction_id)
         VALUES ('LOCAL', 'Cameroun', 'Cameroun', ?)`,
        [txDebit.insertId]
      );

      // Lire nouveaux soldes
      const [[expMAJ]]  = await db.query("SELECT solde FROM compte WHERE utilisateur_id = ?", [userId]);
      const [[destMAJ]] = await db.query("SELECT solde FROM compte WHERE utilisateur_id = ?", [destinataire.id]);

      console.log("Nouveau solde expéditeur :", expMAJ.solde);
      console.log("Nouveau solde destinataire :", destMAJ.solde);
      console.log("=== FIN DEBUG ===");

      return res.status(200).json({
        message:      `✅ ${montantNum.toLocaleString("fr-FR")} XAF envoyés à ${destinataire.nom} avec succès !`,
        transaction:  { id: txDebit.insertId, montant: montantNum, statut: "VALIDEE" },
        destinataire: { nom: destinataire.nom, email: destinataire.email, nouveauSolde: destMAJ.solde },
        nouveauSolde: expMAJ.solde,
      });
    }

    // ══════════════════════════════════════
    //  CAS 2 : VIREMENT BANCAIRE
    // ══════════════════════════════════════

    // DÉBIT expéditeur
    await db.query(
      "UPDATE compte SET solde = solde - ?, updated_at = NOW() WHERE utilisateur_id = ?",
      [montantNum, userId]
    );

    // Transaction
    const [txResult] = await db.query(
      `INSERT INTO transaction (utilisateur_id, montant, statut, dateTransaction)
       VALUES (?, ?, 'VALIDEE', NOW())`,
      [userId, -montantNum]
    );

    await db.query(
      `INSERT INTO transfert (type, paysSource, paysDestination, transaction_id)
       VALUES ('INTERNATIONAL', ?, ?, ?)`,
      [paysSrc || "Cameroun", paysDest || "Cameroun", txResult.insertId]
    );

    const [[compteMAJ]] = await db.query(
      "SELECT solde FROM compte WHERE utilisateur_id = ?",
      [userId]
    );

    return res.status(200).json({
      message:      `✅ Virement de ${montantNum.toLocaleString("fr-FR")} XAF effectué !`,
      transaction:  { id: txResult.insertId, montant: montantNum, statut: "VALIDEE" },
      nouveauSolde: compteMAJ?.solde || 0,
    });

  } catch (error) {
    console.error("Erreur transfert :", error);
    return res.status(500).json({ message: "Erreur : " + error.message });
  }
};

// ═══════════════════════════════════════════════════════════════
//  POST /api/transactions/campay/callback
// ═══════════════════════════════════════════════════════════════
export const campayCallback = async (req, res) => {
  try {
    const { reference, status } = req.body;
    if (!reference) return res.status(400).json({ message: "Référence manquante." });

    const transactionId = reference.split("-")[1];
    const nouveauStatut = status === "SUCCESSFUL" ? "VALIDEE" : "ANNULEE";

    const [[tx]] = await db.query(
      "SELECT utilisateur_id, montant, statut FROM transaction WHERE id = ?",
      [transactionId]
    );

    if (!tx) return res.status(404).json({ message: "Transaction introuvable." });
    if (tx.statut !== "EN_ATTENTE") return res.status(200).json({ message: "Déjà traité." });

    await db.query(
      "UPDATE transaction SET statut = ?, updated_at = NOW() WHERE id = ?",
      [nouveauStatut, transactionId]
    );

    if (nouveauStatut === "VALIDEE" && reference.startsWith("TOPUP-")) {
      await db.query(
        "UPDATE compte SET solde = solde + ?, updated_at = NOW() WHERE utilisateur_id = ?",
        [Math.abs(Number(tx.montant)), tx.utilisateur_id]
      );
      console.log(`✅ Recharge +${tx.montant} XAF → user ${tx.utilisateur_id}`);
    }

    return res.status(200).json({ message: "Callback traité." });

  } catch (error) {
    console.error("Erreur campayCallback :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/transactions/campay/verifier/:reference
// ═══════════════════════════════════════════════════════════════
export const verifierPaiement = async (req, res) => {
  try {
    const statut = await verifierStatutCamPay(req.params.reference);
    return res.status(200).json(statut);
  } catch (error) {
    return res.status(500).json({ message: "Erreur vérification." });
  }
};