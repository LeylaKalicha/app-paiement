import express from "express";
import { getAdminMe, getAdminStats } from "../controllers/admin.controller.js";
import verifierToken from "../middleware/auth.middleware.js";

const router = express.Router();

// ── Middleware : vérifie que c'est bien un ADMIN ──
const verifierAdmin = async (req, res, next) => {
  if (req.utilisateur.type !== "ADMIN") {
    return res.status(403).json({ message: "Accès refusé. Réservé aux administrateurs." });
  }
  next();
};

// GET /api/admin/me    → infos admin connecté
router.get("/me",    verifierToken, verifierAdmin, getAdminMe);

// GET /api/admin/stats → statistiques globales
router.get("/stats", verifierToken, verifierAdmin, getAdminStats);

export default router;