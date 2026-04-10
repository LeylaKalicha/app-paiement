import crypto from "crypto";
import db     from "../config/db.js";

// ═══════════════════════════════════════════════════════════════
//  POST /api/webhooks/flutterwave
//  Route PUBLIQUE — appelée par Flutterwave après traitement
//  Doc : https://developer.flutterwave.com/docs/webhooks
// ═══════════════════════════════════════════════════════════════
export const flutterwaveWebhook = async (req, res) => {
  try {
    // ── 1. Vérifier la signature Flutterwave ──────────────────
    const signature = req.headers["verif-hash"];
    if (!signature || signature !== process.env.FLW_WEBHOOK_SECRET) {
      console.warn("⚠️  Webhook Flutterwave : signature invalide");
      return res.status(401).json({ message: "Signature invalide." });
    }

    const { event, data } = req.body;

    // On ne traite que les événements de transfert
    if (event !== "transfer.completed") {
      return res.status(200).json({ message: "Événement ignoré." });
    }

    const { reference, status } = data;
    // reference = "VIR-{transactionId}-{timestamp}" qu'on a créé côté backend
    const transactionId = reference?.split("-")[1];

    if (!transactionId) {
      return res.status(400).json({ message: "Référence invalide." });
    }

    // ── 2. Récupérer la transaction en base ───────────────────
    const [[tx]] = await db.query(
      "SELECT id, utilisateur_id, montant, statut FROM transaction WHERE id = ?",
      [transactionId]
    );

    if (!tx) {
      return res.status(404).json({ message: "Transaction introuvable." });
    }

    // Éviter les doublons si le webhook arrive plusieurs fois
    if (tx.statut !== "EN_ATTENTE") {
      return res.status(200).json({ message: "Déjà traité." });
    }

    // ── 3. Traitement selon le statut Flutterwave ─────────────
    if (status === "SUCCESSFUL") {
      // Virement réussi → marquer VALIDEE
      await db.query(
        "UPDATE transaction SET statut = 'VALIDEE', updated_at = NOW() WHERE id = ?",
        [transactionId]
      );

      // Notification à l'utilisateur
      await db.query(
        `INSERT INTO notification (titre, message, dateEnvoi, utilisateur_id)
         VALUES (?, ?, NOW(), ?)`,
        [
          "Virement effectué ✅",
          `Votre virement de ${Number(tx.montant).toLocaleString("fr-FR")} XAF a été traité avec succès.`,
          tx.utilisateur_id,
        ]
      );

      console.log(`✅ Virement VALIDÉ — transaction #${transactionId}`);

    } else {
      // Virement échoué → ANNULEE + rembourser le solde
      await db.query(
        "UPDATE transaction SET statut = 'ANNULEE', updated_at = NOW() WHERE id = ?",
        [transactionId]
      );

      // Remboursement
      await db.query(
        "UPDATE compte SET solde = solde + ?, updated_at = NOW() WHERE utilisateur_id = ?",
        [Math.abs(Number(tx.montant)), tx.utilisateur_id]
      );

      // Notification échec
      await db.query(
        `INSERT INTO notification (titre, message, dateEnvoi, utilisateur_id)
         VALUES (?, ?, NOW(), ?)`,
        [
          "Virement échoué ❌",
          `Votre virement de ${Number(tx.montant).toLocaleString("fr-FR")} XAF a échoué. Votre solde a été remboursé.`,
          tx.utilisateur_id,
        ]
      );

      console.log(`❌ Virement ÉCHOUÉ — transaction #${transactionId} — solde remboursé`);
    }

    return res.status(200).json({ message: "Webhook traité." });

  } catch (error) {
    console.error("Erreur flutterwaveWebhook :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};