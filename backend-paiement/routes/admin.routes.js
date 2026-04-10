import express from "express";
import {
  getAdminMe, getAdminStats,
  getUtilisateurs, suspendreutilisateur, activerUtilisateur, supprimerUtilisateur,
  getAllTransactions, validerTransaction, annulerTransaction,
  getAllCartes, bloquerCarteAdmin, debloquerCarteAdmin,
  getNotifications, envoyerNotification,
  getFonds, crediterCompte, validerTransactionFonds,
  getFraudes,
  getSecurite,
  getProfilAdmin,
} from "../controllers/admin.controller.js";
import verifierToken from "../middleware/auth.middleware.js";

const router = express.Router();

// Middleware admin
const verifierAdmin = (req, res, next) => {
  if (req.utilisateur.type !== "ADMIN") {
    return res.status(403).json({ message: "Accès réservé aux administrateurs." });
  }
  next();
};

const auth = [verifierToken, verifierAdmin];

// ── Dashboard ──
router.get("/me",    ...auth, getAdminMe);
router.get("/stats", ...auth, getAdminStats);

// ── Utilisateurs (GestionUtilisateurs.jsx) ──
router.get("/utilisateurs",                ...auth, getUtilisateurs);
router.put("/utilisateurs/:id/suspendre",  ...auth, suspendreutilisateur);
router.put("/utilisateurs/:id/activer",    ...auth, activerUtilisateur);
router.delete("/utilisateurs/:id",         ...auth, supprimerUtilisateur);

// ── Transactions (GestionTransactions.jsx) ──
router.get("/transactions",               ...auth, getAllTransactions);
router.put("/transactions/:id/valider",   ...auth, validerTransaction);
router.put("/transactions/:id/annuler",   ...auth, annulerTransaction);

// ── Cartes (GestionCartes.jsx) ──
router.get("/cartes",              ...auth, getAllCartes);
router.put("/cartes/:id/bloquer",  ...auth, bloquerCarteAdmin);
router.put("/cartes/:id/debloquer",...auth, debloquerCarteAdmin);

// ── Notifications (GestionNotifications.jsx) ──
router.get("/notifications",          ...auth, getNotifications);
router.post("/notifications/envoyer", ...auth, envoyerNotification);

// ── Fonds (GestionFonds.jsx) ──
router.get("/fonds",                          ...auth, getFonds);
router.post("/fonds/crediter",                ...auth, crediterCompte);
router.put("/fonds/transactions/:id/valider", ...auth, validerTransactionFonds);

// ── Fraudes (GestionFraude.jsx) ──
router.get("/fraudes", ...auth, getFraudes);

// ── Sécurité (GestionSecurite.jsx) ──
router.get("/securite", ...auth, getSecurite);

// ── Profil admin (Profil.jsx) ──
router.get("/profil", ...auth, getProfilAdmin);

export default router;