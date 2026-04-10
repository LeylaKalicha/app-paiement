import db from "../config/db.js";

// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/me
//  → TableauDeBord.jsx : api.get("/admin/me")
// ═══════════════════════════════════════════════════════════════
export const getAdminMe = async (req, res) => {
  try {
    const [[admin]] = await db.query(
      "SELECT id, nom, email, telephone, statut, type, created_at FROM utilisateur WHERE id = ? AND type = 'ADMIN'",
      [req.utilisateur.id]
    );
    if (!admin) return res.status(403).json({ message: "Accès refusé." });
    return res.status(200).json({ admin });
  } catch (error) {
    console.error("Erreur getAdminMe :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/stats
//  → DashboardContenu : StatCard (total tx, clients, solde, cartes, suspendus)
// ═══════════════════════════════════════════════════════════════
export const getAdminStats = async (req, res) => {
  try {
    const [[{ totalTransactions }]] = await db.query(
      "SELECT COUNT(*) as totalTransactions FROM transaction"
    );
    const [[{ totalClients }]] = await db.query(
      "SELECT COUNT(*) as totalClients FROM utilisateur WHERE type = 'USER'"
    );
    const [[{ soldeTotal }]] = await db.query(
      "SELECT COALESCE(SUM(solde), 0) as soldeTotal FROM compte"
    );
    const [[{ totalCartes }]] = await db.query(
      "SELECT COUNT(*) as totalCartes FROM cartevirtuelle WHERE statut = 'ACTIVE'"
    );
    const [[{ comptesSuspendus }]] = await db.query(
      "SELECT COUNT(*) as comptesSuspendus FROM utilisateur WHERE statut = 'SUSPENDU'"
    );
    const [[{ transactionsAujourdhui }]] = await db.query(
      "SELECT COUNT(*) as transactionsAujourdhui FROM transaction WHERE DATE(dateTransaction) = CURDATE()"
    );

    return res.status(200).json({
      totalTransactions,
      totalClients,
      soldeTotal,
      totalCartes,
      comptesSuspendus,
      transactionsAujourdhui,
    });
  } catch (error) {
    console.error("Erreur getAdminStats :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/utilisateurs
//  → GestionUtilisateurs.jsx : tableau utilisateurs avec solde
//  Tables : utilisateur + compte
// ═══════════════════════════════════════════════════════════════
export const getUtilisateurs = async (req, res) => {
  try {
    const [utilisateurs] = await db.query(
      `SELECT u.id, u.nom, u.email, u.telephone, u.statut, u.type,
              u.created_at, COALESCE(c.solde, 0) as solde, COALESCE(c.devise, 'XAF') as devise
       FROM utilisateur u
       LEFT JOIN compte c ON c.utilisateur_id = u.id
       ORDER BY u.created_at DESC`
    );
    return res.status(200).json({ utilisateurs });
  } catch (error) {
    console.error("Erreur getUtilisateurs :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  PUT /api/admin/utilisateurs/:id/suspendre
//  → GestionUtilisateurs.jsx : bouton "Suspendre"
// ═══════════════════════════════════════════════════════════════
export const suspendreutilisateur = async (req, res) => {
  try {
    const { id } = req.params;
    if (Number(id) === req.utilisateur.id) {
      return res.status(400).json({ message: "Vous ne pouvez pas vous suspendre vous-même." });
    }
    await db.query(
      "UPDATE utilisateur SET statut = 'SUSPENDU', updated_at = NOW() WHERE id = ?",
      [id]
    );
    return res.status(200).json({ message: "Utilisateur suspendu." });
  } catch (error) {
    console.error("Erreur suspendreutilisateur :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  PUT /api/admin/utilisateurs/:id/activer
//  → GestionUtilisateurs.jsx : bouton "Réactiver"
// ═══════════════════════════════════════════════════════════════
export const activerUtilisateur = async (req, res) => {
  try {
    await db.query(
      "UPDATE utilisateur SET statut = 'ACTIF', updated_at = NOW() WHERE id = ?",
      [req.params.id]
    );
    return res.status(200).json({ message: "Utilisateur activé." });
  } catch (error) {
    console.error("Erreur activerUtilisateur :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  DELETE /api/admin/utilisateurs/:id
//  → GestionUtilisateurs.jsx : bouton "Supprimer"
// ═══════════════════════════════════════════════════════════════
export const supprimerUtilisateur = async (req, res) => {
  try {
    const { id } = req.params;
    if (Number(id) === req.utilisateur.id) {
      return res.status(400).json({ message: "Vous ne pouvez pas supprimer votre propre compte." });
    }
    // Supprimer dans l'ordre (dépendances)
    await db.query("DELETE FROM notification    WHERE utilisateur_id = ?", [id]);
    await db.query("DELETE FROM cartevirtuelle  WHERE utilisateur_id = ?", [id]);
    await db.query("DELETE FROM transaction     WHERE utilisateur_id = ?", [id]);
    await db.query("DELETE FROM compte          WHERE utilisateur_id = ?", [id]);
    await db.query("DELETE FROM utilisateur     WHERE id = ?",             [id]);
    return res.status(200).json({ message: "Utilisateur supprimé." });
  } catch (error) {
    console.error("Erreur supprimerUtilisateur :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/transactions
//  → GestionTransactions.jsx : tableau historique + graphiques
//  Tables : transaction + utilisateur + transfert
// ═══════════════════════════════════════════════════════════════
export const getAllTransactions = async (req, res) => {
  try {
    const { statut, limite = 100 } = req.query;
    let sql = `
      SELECT t.id, t.montant, t.statut, t.dateTransaction,
             u.nom  AS envoyeur, u.email,
             tr.type AS typeTransfert, tr.paysSource, tr.paysDestination
      FROM transaction t
      LEFT JOIN utilisateur u  ON u.id = t.utilisateur_id
      LEFT JOIN transfert   tr ON tr.transaction_id = t.id
    `;
    const params = [];
    if (statut) { sql += " WHERE t.statut = ?"; params.push(statut); }
    sql += ` ORDER BY t.dateTransaction DESC LIMIT ${parseInt(limite)}`;

    const [transactions] = await db.query(sql, params);

    // Données pour graphique "transactions dans le temps" (7 derniers jours)
    const [parJour] = await db.query(
      `SELECT DATE(dateTransaction) as date,
              SUM(CASE WHEN statut = 'VALIDEE' THEN 1 ELSE 0 END) as completee,
              SUM(CASE WHEN statut = 'ANNULEE' THEN 1 ELSE 0 END) as echouee
       FROM transaction
       WHERE dateTransaction >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(dateTransaction)
       ORDER BY date ASC`
    );

    return res.status(200).json({ transactions, parJour });
  } catch (error) {
    console.error("Erreur getAllTransactions :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  PUT /api/admin/transactions/:id/valider
//  → GestionTransactions.jsx : bouton "Valider"
// ═══════════════════════════════════════════════════════════════
export const validerTransaction = async (req, res) => {
  try {
    await db.query(
      "UPDATE transaction SET statut = 'VALIDEE', updated_at = NOW() WHERE id = ?",
      [req.params.id]
    );
    return res.status(200).json({ message: "Transaction validée." });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  PUT /api/admin/transactions/:id/annuler
//  → GestionTransactions.jsx : bouton "Rejeter"
// ═══════════════════════════════════════════════════════════════
export const annulerTransaction = async (req, res) => {
  try {
    await db.query(
      "UPDATE transaction SET statut = 'ANNULEE', updated_at = NOW() WHERE id = ?",
      [req.params.id]
    );
    return res.status(200).json({ message: "Transaction annulée." });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/cartes
//  → GestionCartes.jsx : tableau toutes les cartes
//  Tables : cartevirtuelle + utilisateur
// ═══════════════════════════════════════════════════════════════
export const getAllCartes = async (req, res) => {
  try {
    const [cartes] = await db.query(
      `SELECT c.id, c.numero, c.dateExpiration, c.statut, c.created_at,
              u.nom AS nomUtilisateur, u.email
       FROM cartevirtuelle c
       LEFT JOIN utilisateur u ON u.id = c.utilisateur_id
       ORDER BY c.created_at DESC`
    );

    // Stats pour GestionCartes
    const [[{ totalActives }]]   = await db.query("SELECT COUNT(*) as totalActives   FROM cartevirtuelle WHERE statut = 'ACTIVE'");
    const [[{ totalBloquees }]]  = await db.query("SELECT COUNT(*) as totalBloquees  FROM cartevirtuelle WHERE statut = 'BLOQUEE'");

    return res.status(200).json({ cartes, totalActives, totalBloquees });
  } catch (error) {
    console.error("Erreur getAllCartes :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  PUT /api/admin/cartes/:id/bloquer
//  → GestionCartes.jsx : bouton "Bloquer"
// ═══════════════════════════════════════════════════════════════
export const bloquerCarteAdmin = async (req, res) => {
  try {
    await db.query(
      "UPDATE cartevirtuelle SET statut = 'BLOQUEE', updated_at = NOW() WHERE id = ?",
      [req.params.id]
    );
    return res.status(200).json({ message: "Carte bloquée." });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  PUT /api/admin/cartes/:id/debloquer
//  → GestionCartes.jsx : bouton "Débloquer"
// ═══════════════════════════════════════════════════════════════
export const debloquerCarteAdmin = async (req, res) => {
  try {
    await db.query(
      "UPDATE cartevirtuelle SET statut = 'ACTIVE', updated_at = NOW() WHERE id = ?",
      [req.params.id]
    );
    return res.status(200).json({ message: "Carte débloquée." });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/notifications
//  → GestionNotifications.jsx : historique des notifications
//  Table : notification + utilisateur
// ═══════════════════════════════════════════════════════════════
export const getNotifications = async (req, res) => {
  try {
    const [notifications] = await db.query(
      `SELECT n.id, n.titre, n.message, n.dateEnvoi,
              u.nom AS nomUtilisateur, u.email
       FROM notification n
       LEFT JOIN utilisateur u ON u.id = n.utilisateur_id
       ORDER BY n.dateEnvoi DESC
       LIMIT 100`
    );

    const [[{ total }]]   = await db.query("SELECT COUNT(*) as total   FROM notification");
    const [[{ urgentes }]] = await db.query(
      "SELECT COUNT(*) as urgentes FROM notification WHERE titre LIKE '%URGENT%' OR titre LIKE '%urgent%'"
    );

    return res.status(200).json({ notifications, total, urgentes });
  } catch (error) {
    console.error("Erreur getNotifications :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  POST /api/admin/notifications/envoyer
//  → GestionNotifications.jsx : formulaire envoi
//  Table : notification
// ═══════════════════════════════════════════════════════════════
export const envoyerNotification = async (req, res) => {
  try {
    const { titre, message, utilisateur_id, urgent } = req.body;

    if (!titre || !message) {
      return res.status(400).json({ message: "Titre et message obligatoires." });
    }

    const titreFinal = urgent ? `[URGENT] ${titre}` : titre;

    if (utilisateur_id === "tous" || !utilisateur_id) {
      // Envoyer à tous les utilisateurs actifs
      const [utilisateurs] = await db.query(
        "SELECT id FROM utilisateur WHERE type = 'USER' AND statut = 'ACTIF'"
      );
      for (const u of utilisateurs) {
        await db.query(
          "INSERT INTO notification (titre, message, dateEnvoi, utilisateur_id) VALUES (?, ?, NOW(), ?)",
          [titreFinal, message, u.id]
        );
      }
      return res.status(201).json({
        message: `Notification envoyée à ${utilisateurs.length} utilisateurs.`,
        count: utilisateurs.length,
      });
    } else {
      await db.query(
        "INSERT INTO notification (titre, message, dateEnvoi, utilisateur_id) VALUES (?, ?, NOW(), ?)",
        [titreFinal, message, utilisateur_id]
      );
      return res.status(201).json({ message: "Notification envoyée.", count: 1 });
    }
  } catch (error) {
    console.error("Erreur envoyerNotification :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/fonds
//  → GestionFonds.jsx : solde total + liste comptes + évolution
//  Tables : compte + utilisateur + transaction
// ═══════════════════════════════════════════════════════════════
export const getFonds = async (req, res) => {
  try {
    // Liste des comptes avec utilisateur
    const [comptes] = await db.query(
      `SELECT c.id, c.solde, c.devise, c.updated_at,
              u.id as utilisateur_id, u.nom, u.email, u.statut
       FROM compte c
       LEFT JOIN utilisateur u ON u.id = c.utilisateur_id
       ORDER BY c.solde DESC`
    );

    // Solde total
    const [[{ soldeTotal }]] = await db.query(
      "SELECT COALESCE(SUM(solde), 0) as soldeTotal FROM compte"
    );

    // Total entrées (montants positifs validés)
    const [[{ totalEntrees }]] = await db.query(
      "SELECT COALESCE(SUM(montant), 0) as totalEntrees FROM transaction WHERE statut = 'VALIDEE' AND montant > 0"
    );

    // Total sorties (montants négatifs validés)
    const [[{ totalSorties }]] = await db.query(
      "SELECT COALESCE(SUM(ABS(montant)), 0) as totalSorties FROM transaction WHERE statut = 'VALIDEE' AND montant < 0"
    );

    // En attente
    const [[{ enAttente }]] = await db.query(
      "SELECT COUNT(*) as enAttente FROM transaction WHERE statut = 'EN_ATTENTE'"
    );

    // Évolution 6 derniers mois
    const [evolution] = await db.query(
      `SELECT DATE_FORMAT(dateTransaction, '%b') as mois,
              COALESCE(SUM(CASE WHEN montant > 0 THEN montant ELSE 0 END), 0) as entree,
              COALESCE(SUM(CASE WHEN montant < 0 THEN ABS(montant) ELSE 0 END), 0) as sortie
       FROM transaction
       WHERE statut = 'VALIDEE'
         AND dateTransaction >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(dateTransaction, '%Y-%m'), DATE_FORMAT(dateTransaction, '%b')
       ORDER BY MIN(dateTransaction) ASC`
    );

    // Historique transactions pour le tableau
    const [transactions] = await db.query(
      `SELECT t.id, t.montant, t.statut, t.dateTransaction,
              u.nom AS utilisateur, u.email,
              tr.type AS typeTransfert
       FROM transaction t
       LEFT JOIN utilisateur u  ON u.id = t.utilisateur_id
       LEFT JOIN transfert   tr ON tr.transaction_id = t.id
       ORDER BY t.dateTransaction DESC
       LIMIT 50`
    );

    return res.status(200).json({
      comptes, soldeTotal, totalEntrees, totalSorties, enAttente,
      evolution, transactions,
    });
  } catch (error) {
    console.error("Erreur getFonds :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  POST /api/admin/fonds/crediter
//  → GestionFonds.jsx : créditer manuellement un compte
//  Tables : compte + transaction
// ═══════════════════════════════════════════════════════════════
export const crediterCompte = async (req, res) => {
  try {
    const { utilisateur_id, montant, description } = req.body;

    if (!utilisateur_id || !montant) {
      return res.status(400).json({ message: "Utilisateur et montant obligatoires." });
    }

    const [[compte]] = await db.query(
      "SELECT id FROM compte WHERE utilisateur_id = ?", [utilisateur_id]
    );
    if (!compte) return res.status(404).json({ message: "Compte introuvable." });

    // Créditer le compte
    await db.query(
      "UPDATE compte SET solde = solde + ?, updated_at = NOW() WHERE utilisateur_id = ?",
      [Math.abs(Number(montant)), utilisateur_id]
    );

    // Enregistrer la transaction
    await db.query(
      `INSERT INTO transaction (utilisateur_id, montant, statut, dateTransaction)
       VALUES (?, ?, 'VALIDEE', NOW())`,
      [utilisateur_id, Math.abs(Number(montant))]
    );

    const [[compteMAJ]] = await db.query(
      "SELECT solde FROM compte WHERE utilisateur_id = ?", [utilisateur_id]
    );

    return res.status(200).json({
      message: `✅ Compte crédité de ${Number(montant).toLocaleString("fr-FR")} XAF.`,
      nouveauSolde: compteMAJ.solde,
    });
  } catch (error) {
    console.error("Erreur crediterCompte :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  PUT /api/admin/fonds/transactions/:id/valider
//  → GestionFonds.jsx : bouton "Valider" dans le tableau
// ═══════════════════════════════════════════════════════════════
export const validerTransactionFonds = async (req, res) => {
  try {
    const { id } = req.params;
    const [[tx]] = await db.query(
      "SELECT utilisateur_id, montant, statut FROM transaction WHERE id = ?", [id]
    );
    if (!tx) return res.status(404).json({ message: "Transaction introuvable." });
    if (tx.statut !== "EN_ATTENTE") return res.status(400).json({ message: "Déjà traitée." });

    await db.query(
      "UPDATE transaction SET statut = 'VALIDEE', updated_at = NOW() WHERE id = ?", [id]
    );

    // Si montant positif → créditer
    if (Number(tx.montant) > 0) {
      await db.query(
        "UPDATE compte SET solde = solde + ?, updated_at = NOW() WHERE utilisateur_id = ?",
        [tx.montant, tx.utilisateur_id]
      );
    }

    return res.status(200).json({ message: "Transaction validée." });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/fraudes
//  → GestionFraude.jsx : transactions suspectes
//  Tables : transaction + utilisateur + transfert
// ═══════════════════════════════════════════════════════════════
export const getFraudes = async (req, res) => {
  try {
    const [fraudes] = await db.query(
      `SELECT t.id, t.montant, t.statut, t.dateTransaction,
              u.nom AS nomUtilisateur, u.email, u.telephone,
              tr.type AS typeTransfert
       FROM transaction t
       LEFT JOIN utilisateur u  ON u.id = t.utilisateur_id
       LEFT JOIN transfert   tr ON tr.transaction_id = t.id
       WHERE ABS(t.montant) > 100000
          OR (t.statut = 'EN_ATTENTE' AND t.dateTransaction < DATE_SUB(NOW(), INTERVAL 24 HOUR))
       ORDER BY t.dateTransaction DESC
       LIMIT 50`
    );

    const [[{ totalSuspectes }]] = await db.query(
      `SELECT COUNT(*) as totalSuspectes FROM transaction
       WHERE ABS(montant) > 100000
          OR (statut = 'EN_ATTENTE' AND dateTransaction < DATE_SUB(NOW(), INTERVAL 24 HOUR))`
    );

    // Données graphique types suspects
    const [parType] = await db.query(
      `SELECT
         SUM(CASE WHEN ABS(montant) > 100000 THEN 1 ELSE 0 END) as montantEleve,
         SUM(CASE WHEN statut = 'EN_ATTENTE' THEN 1 ELSE 0 END) as enAttenteProlong
       FROM transaction`
    );

    return res.status(200).json({ fraudes, totalSuspectes, parType: parType[0] });
  } catch (error) {
    console.error("Erreur getFraudes :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/securite
//  → GestionSecurite.jsx : stats sécurité
//  Tables : utilisateur + transaction + cartevirtuelle
// ═══════════════════════════════════════════════════════════════
export const getSecurite = async (req, res) => {
  try {
    const [[{ totalActifs }]]          = await db.query("SELECT COUNT(*) as totalActifs          FROM utilisateur WHERE statut = 'ACTIF'");
    const [[{ totalSuspendus }]]       = await db.query("SELECT COUNT(*) as totalSuspendus       FROM utilisateur WHERE statut = 'SUSPENDU'");
    const [[{ totalInactifs }]]        = await db.query("SELECT COUNT(*) as totalInactifs        FROM utilisateur WHERE statut = 'INACTIF'");
    const [[{ transactionsAnnulees }]] = await db.query("SELECT COUNT(*) as transactionsAnnulees FROM transaction WHERE statut = 'ANNULEE'");
    const [[{ transactionsEnAttente }]]= await db.query("SELECT COUNT(*) as transactionsEnAttente FROM transaction WHERE statut = 'EN_ATTENTE'");
    const [[{ cartesBloquees }]]       = await db.query("SELECT COUNT(*) as cartesBloquees       FROM cartevirtuelle WHERE statut = 'BLOQUEE'");
    const [[{ totalTransactions }]]    = await db.query("SELECT COUNT(*) as totalTransactions    FROM transaction");

    return res.status(200).json({
      totalActifs, totalSuspendus, totalInactifs,
      transactionsAnnulees, transactionsEnAttente,
      cartesBloquees, totalTransactions,
    });
  } catch (error) {
    console.error("Erreur getSecurite :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/profil
//  → Profil.jsx : infos admin + stats parrainage simulé
// ═══════════════════════════════════════════════════════════════
export const getProfilAdmin = async (req, res) => {
  try {
    const [[admin]] = await db.query(
      "SELECT id, nom, email, telephone, statut, type, created_at FROM utilisateur WHERE id = ? AND type = 'ADMIN'",
      [req.utilisateur.id]
    );
    if (!admin) return res.status(403).json({ message: "Accès refusé." });

    // Liste des utilisateurs pour onglet parrainage
    const [utilisateurs] = await db.query(
      "SELECT id, nom, email, telephone, statut FROM utilisateur WHERE type = 'USER' ORDER BY nom ASC"
    );

    return res.status(200).json({ admin, utilisateurs });
  } catch (error) {
    console.error("Erreur getProfilAdmin :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};