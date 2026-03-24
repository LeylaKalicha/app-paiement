import db from "../config/db.js";

// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/me
//  Retourne les infos de l'admin connecté
// ═══════════════════════════════════════════════════════════════
export const getAdminMe = async (req, res) => {
  try {
    const adminId = req.utilisateur.id;

    const [rows] = await db.query(
      "SELECT id, nom, email, telephone, statut, type, created_at FROM utilisateur WHERE id = ? AND type = 'ADMIN'",
      [adminId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: "Accès refusé. Compte administrateur introuvable." });
    }

    return res.status(200).json({ admin: rows[0] });

  } catch (error) {
    console.error("Erreur getAdminMe :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/stats
//  Statistiques globales pour le dashboard admin
// ═══════════════════════════════════════════════════════════════
export const getAdminStats = async (req, res) => {
  try {
    // ── Total utilisateurs ──
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) as total FROM utilisateur WHERE type = 'USER'"
    );

    // ── Comptes suspendus ──
    const [[{ suspendus }]] = await db.query(
      "SELECT COUNT(*) as suspendus FROM utilisateur WHERE statut = 'SUSPENDU'"
    );

    // ── Total transactions ──
    const [[{ transactions }]] = await db.query(
      "SELECT COUNT(*) as transactions FROM transaction"
    );

    // ── Total cartes ──
    const [[{ cartes }]] = await db.query(
      "SELECT COUNT(*) as cartes FROM cartevirtuelle"
    );

    // ── Solde total (somme de tous les comptes) ──
    const [[{ soldeTotal }]] = await db.query(
      "SELECT COALESCE(SUM(solde), 0) as soldeTotal FROM compte"
    );

    return res.status(200).json({
      totalUtilisateurs: total       || 0,
      comptesSuspendus:  suspendus   || 0,
      totalTransactions: transactions|| 0,
      totalCartes:       cartes      || 0,
      soldeTotal:        soldeTotal  || 0,
    });

  } catch (error) {
    console.error("Erreur getAdminStats :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};