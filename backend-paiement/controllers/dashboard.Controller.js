import db from "../config/db.js";

// ═══════════════════════════════════════════════════════════════
//  GET /api/dashboard
//  Appelé par Dashboard.jsx → useEffect → api.get("/dashboard")
//
//  Retourne toutes les données pour la page principale :
//  user, solde, devise, totalTransactions, paiementsEnAttente,
//  cartesActives, transactionsRecentes
//
//  Tables : utilisateur, compte, transaction, transfert, cartevirtuelle
// ═══════════════════════════════════════════════════════════════
export const getDashboard = async (req, res) => {
  try {
    const userId = req.utilisateur.id;

    // 1. Utilisateur
    const [[user]] = await db.query(
      "SELECT id, nom, email, telephone, statut, type FROM utilisateur WHERE id = ?",
      [userId]
    );
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    // 2. Compte → solde + devise
    const [[compte]] = await db.query(
      "SELECT solde, devise FROM compte WHERE utilisateur_id = ?",
      [userId]
    );

    // 3. Total transactions
    const [[{ totalTransactions }]] = await db.query(
      "SELECT COUNT(*) AS totalTransactions FROM transaction WHERE utilisateur_id = ?",
      [userId]
    );

    // 4. Paiements en attente
    const [[{ paiementsEnAttente }]] = await db.query(
      "SELECT COUNT(*) AS paiementsEnAttente FROM transaction WHERE utilisateur_id = ? AND statut = 'EN_ATTENTE'",
      [userId]
    );

    // 5. Cartes actives
    const [[{ cartesActives }]] = await db.query(
      "SELECT COUNT(*) AS cartesActives FROM cartevirtuelle WHERE utilisateur_id = ? AND statut = 'ACTIVE'",
      [userId]
    );

    // 6. 5 dernières transactions
    const [transactionsRecentes] = await db.query(
      `SELECT t.id, t.montant, t.statut, t.dateTransaction,
              tr.type AS typeTransfert
       FROM transaction t
       LEFT JOIN transfert tr ON tr.transaction_id = t.id
       WHERE t.utilisateur_id = ?
       ORDER BY t.dateTransaction DESC
       LIMIT 5`,
      [userId]
    );

    return res.status(200).json({
      user,
      solde:              compte?.solde             || 0,
      devise:             compte?.devise            || "XAF",
      totalTransactions:  totalTransactions         || 0,
      paiementsEnAttente: paiementsEnAttente        || 0,
      cartesActives:      cartesActives             || 0,
      transactionsRecentes,
    });
  } catch (err) {
    console.error("getDashboard :", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};